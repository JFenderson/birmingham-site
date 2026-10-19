import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { deflateRawSync } from "node:zlib";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { parseShoeImport, csvRecords, xlsxRecords } from "../../src/lib/shoes/import.ts";

const chapterId = "11111111-1111-4111-8111-111111111111";
const actorId = "22222222-2222-4222-8222-222222222222";

async function setup(context: { after: (callback: () => Promise<void>) => void }) {
  const db = new PGlite();
  context.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    insert into auth.users values ('${actorId}');
    create table public.chapters(id uuid primary key, slug text unique);
    insert into public.chapters values ('${chapterId}', 'root');
    create table public.profiles(id uuid primary key, chapter_id uuid, membership_status text, role text);
    insert into public.profiles values ('${actorId}', '${chapterId}', 'approved', 'super_admin');
    grant select on public.profiles to service_role;
  `);
  await db.exec(readFileSync("supabase/migrations/20261019155341_shoes_for_kids.sql", "utf8"));
  await db.exec("grant usage on schema public to service_role, anon, authenticated; set role service_role;");
  const campaign = await db.query<{ id: string }>("update public.shoe_campaigns set status = 'published' where code = 'sfk-2026' returning id");
  return { db, campaignId: campaign.rows[0]!.id };
}

function sponsor(email: string) {
  return JSON.stringify({ name: "Shoe Sponsor", email, sponsorType: "individual", recognitionConsent: false });
}

test("both adoption methods share atomic request inventory and private tables", async (context) => {
  const { db, campaignId } = await setup(context);
  const requestId = "33333333-3333-4333-8333-333333333333";
  await db.query(`insert into public.shoe_requests(id,campaign_id,external_ref,public_ref,school_code,size_system,shoe_size,width,shoe_type)
    values ($1,$2,'school-1','SFK-2026-A','SC1','youth','4','standard','Athletic sneakers')`, [requestId, campaignId]);
  const reserve = (selection: unknown, token: string) => db.query<{ result: { reference: string } }>(
    "select public.shoe_reserve($1,$2::jsonb,$3::jsonb,$4,'dropoff') as result",
    [campaignId, sponsor(`${token}@example.com`), JSON.stringify([selection]), token.repeat(64)],
  );
  const first = await reserve({ requestId, quantity: 1 }, "a");
  assert.match(first.rows[0]!.result.reference, /^SFK-R-2026-/);
  await assert.rejects(() => reserve({ sizeSystem: "youth", shoeSize: "4", width: "standard", shoeType: "Athletic sneakers", quantity: 1 }, "b"), /INVENTORY_CHANGED/);
  const count = await db.query<{ count: number }>("select count(*)::int as count from public.shoe_reservation_items");
  assert.equal(count.rows[0]?.count, 1);
  await db.exec("reset role; set role anon;");
  await assert.rejects(() => db.query("select * from public.shoe_sponsors"), /permission denied/);
  await assert.rejects(() => db.query("select public.shoe_reserve(null,null,null,null,null)"), /permission denied/);
});

test("multi-size reservations are all-or-nothing and expire for reassignment", async (context) => {
  const { db, campaignId } = await setup(context);
  await db.query(`insert into public.shoe_requests(campaign_id,external_ref,public_ref,school_code,size_system,shoe_size,width,shoe_type)
    values ($1,'a','A','SC','youth','2','standard','Athletic sneakers'),
           ($1,'b','B','SC','youth','4','standard','Athletic sneakers')`, [campaignId]);
  const items = [
    { sizeSystem: "youth", shoeSize: "2", width: "standard", shoeType: "Athletic sneakers", quantity: 1 },
    { sizeSystem: "youth", shoeSize: "4", width: "standard", shoeType: "Athletic sneakers", quantity: 1 },
  ];
  await assert.rejects(() => db.query("select public.shoe_reserve($1,$2::jsonb,$3::jsonb,$4,'dropoff')",
    [campaignId, sponsor("too-many@example.com"), JSON.stringify([{ ...items[0], quantity: 2 }]), "c".repeat(64)]), /INVENTORY_CHANGED/);
  const unreserved = await db.query<{ count: number }>("select count(*)::int as count from public.shoe_requests where status = 'available'");
  assert.equal(unreserved.rows[0]?.count, 2);
  await db.query("select public.shoe_reserve($1,$2::jsonb,$3::jsonb,$4,'dropoff')",
    [campaignId, sponsor("group@example.com"), JSON.stringify(items), "d".repeat(64)]);
  await db.exec("update public.shoe_requests set reserved_until = now() - interval '1 second' where status = 'reserved'");
  const expired = await db.query<{ count: number }>("select public.shoe_expire_reservations() as count");
  assert.equal(expired.rows[0]?.count, 2);
  const available = await db.query<{ count: number }>("select count(*)::int as count from public.shoe_requests where status = 'available'");
  assert.equal(available.rows[0]?.count, 2);
});

test("partial check-in cannot receive the same pair twice", async (context) => {
  const { db, campaignId } = await setup(context);
  await db.query(`insert into public.shoe_requests(campaign_id,external_ref,public_ref,school_code,size_system,shoe_size,width,shoe_type)
    values ($1,'a','A','SC','youth','2','standard','Athletic sneakers'),
           ($1,'b','B','SC','youth','2','standard','Athletic sneakers')`, [campaignId]);
  const reservation = await db.query<{ result: { id: string } }>("select public.shoe_reserve($1,$2::jsonb,$3::jsonb,$4,'dropoff') as result",
    [campaignId, sponsor("checkin@example.com"), JSON.stringify([{ sizeSystem: "youth", shoeSize: "2", width: "standard", shoeType: "Athletic sneakers", quantity: 2 }]), "e".repeat(64)]);
  const request = await db.query<{ id: string }>("select id from public.shoe_requests order by external_ref limit 1");
  const check = () => db.query<{ accepted: boolean }>("select public.shoe_check_in($1,$2,true,true,true,true,'new') as accepted", [request.rows[0]!.id, actorId]);
  assert.equal((await check()).rows[0]?.accepted, true);
  assert.equal((await check()).rows[0]?.accepted, false);
  const status = await db.query<{ status: string }>("select status from public.shoe_reservations where id = $1", [reservation.rows[0]!.result.id]);
  assert.equal(status.rows[0]?.status, "partially_received");
});

test("imports expand quantity and reject duplicate anonymous references", () => {
  const headers = "External Request Reference,School Code,Shoe Size System,Shoe Size,Shoe Width,Shoe Type,Quantity";
  const parsed = parseShoeImport(csvRecords(`${headers}\nA1,SC,youth,4,standard,Athletic sneakers,2`));
  assert.deepEqual(parsed.rows.map((row) => row.externalRef), ["A1#1", "A1#2"]);
  assert.equal(parseShoeImport(csvRecords(`${headers}\nA1,SC,youth,4,standard,Athletic sneakers,1\nA1,SC,youth,4,standard,Athletic sneakers,1`)).errors.length, 1);
});

test("XLSX first worksheet reads shared strings without evaluating formulas", () => {
  const strings = ["External Request Reference","School Code","Shoe Size System","Shoe Size","Shoe Width","Shoe Type","Quantity","A1","SC","youth","4","standard","Athletic sneakers","2"];
  const shared = `<sst>${strings.map((value) => `<si><t>${value}</t></si>`).join("")}</sst>`;
  const cells = (values: number[], row: number) => values.map((value, index) => `<c r="${String.fromCharCode(65 + index)}${row}" t="s"><v>${value}</v></c>`).join("");
  const sheet = `<worksheet><sheetData><row r="1">${cells([0,1,2,3,4,5,6],1)}</row><row r="2">${cells([7,8,9,10,11,12,13],2)}</row></sheetData></worksheet>`;
  const entries = [["xl/sharedStrings.xml",shared],["xl/worksheets/sheet1.xml",sheet]] as const;
  const local: Buffer[] = [], central: Buffer[] = [];
  let offset = 0;
  for (const [name, xml] of entries) {
    const filename = Buffer.from(name), bytes = deflateRawSync(Buffer.from(xml));
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(8, 8);
    header.writeUInt32LE(bytes.length, 18); header.writeUInt32LE(Buffer.byteLength(xml), 22);
    header.writeUInt16LE(filename.length, 26);
    local.push(header, filename, bytes);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0); directory.writeUInt16LE(8, 10);
    directory.writeUInt32LE(bytes.length, 20); directory.writeUInt32LE(Buffer.byteLength(xml), 24);
    directory.writeUInt16LE(filename.length, 28); directory.writeUInt32LE(offset, 42);
    central.push(directory, filename);
    offset += header.length + filename.length + bytes.length;
  }
  const directory = Buffer.concat(central), ending = Buffer.alloc(22);
  ending.writeUInt32LE(0x06054b50, 0); ending.writeUInt16LE(entries.length, 8);
  ending.writeUInt16LE(entries.length, 10); ending.writeUInt32LE(directory.length, 12);
  ending.writeUInt32LE(offset, 16);
  const parsed = parseShoeImport(xlsxRecords(Buffer.concat([...local, directory, ending])));
  assert.equal(parsed.errors.length, 0);
  assert.deepEqual(parsed.rows.map((row) => row.externalRef), ["A1#1","A1#2"]);
});

test("deadline cap, verified funding, purchase and distribution stay distinct", async (context) => {
  const { db, campaignId } = await setup(context);
  await db.query("update public.shoe_campaigns set physical_deadline = now() + interval '12 hours' where id = $1", [campaignId]);
  const request = await db.query<{ id: string }>(`insert into public.shoe_requests(campaign_id,external_ref,public_ref,school_code,size_system,shoe_size,width,shoe_type)
    values ($1,'a','A','SC','youth','4','standard','Athletic sneakers') returning id`, [campaignId]);
  const reservation = await db.query<{ result: { expiresAt: string } }>("select public.shoe_reserve($1,$2::jsonb,$3::jsonb,$4,'dropoff') as result",
    [campaignId, sponsor("deadline@example.com"), JSON.stringify([{ requestId: request.rows[0]!.id, quantity: 1 }]), "f".repeat(64)]);
  const deadline = await db.query<{ physical_deadline: string }>("select physical_deadline from public.shoe_campaigns where id = $1", [campaignId]);
  assert.ok(Date.parse(reservation.rows[0]!.result.expiresAt) <= Date.parse(deadline.rows[0]!.physical_deadline) + 1000);

  const donation = { transactionId: "ZEFFY-123", amountCents: 5000, refundedCents: 0, currency: "USD", status: "succeeded", donorReference: "", paidAt: "" };
  for (const row of [donation, donation]) await db.query("select public.shoe_import_donations($1,$2,$3::jsonb)", [campaignId, actorId, JSON.stringify([row])]);
  const count = await db.query<{ count: number }>("select count(*)::int as count from public.shoe_donations");
  assert.equal(count.rows[0]?.count, 1);
  const donationId = await db.query<{ id: string }>("select id from public.shoe_donations where zeffy_transaction_id = 'ZEFFY-123'");
  const funded = await db.query<{ ok: boolean }>("select public.shoe_allocate_funds($1,$2,$3,$4,4000) as ok",
    [campaignId, actorId, donationId.rows[0]!.id, request.rows[0]!.id]);
  assert.equal(funded.rows[0]?.ok, true);
  const stillReserved = await db.query<{ status: string }>("select status from public.shoe_requests where id = $1", [request.rows[0]!.id]);
  assert.equal(stillReserved.rows[0]?.status, "reserved");
  await db.query("select public.shoe_cancel_reservation(reservation_id,$1) from public.shoe_requests where id = $2", [actorId, request.rows[0]!.id]);
  const allocation = await db.query<{ id: string }>("select id from public.shoe_allocations limit 1");
  const purchased = await db.query<{ ok: boolean }>("select public.shoe_record_purchase($1,$2,3500,$3,'receipt') as ok",
    [request.rows[0]!.id, actorId, allocation.rows[0]!.id]);
  assert.equal(purchased.rows[0]?.ok, true);
  const distributed = await db.query<{ ok: boolean }>("select public.shoe_distribute($1,$2,'SCHOOL-DELIVERY-1') as ok", [request.rows[0]!.id, actorId]);
  assert.equal(distributed.rows[0]?.ok, true);
  assert.equal((await db.query<{ ok: boolean }>("select public.shoe_distribute($1,$2,'SCHOOL-DELIVERY-1') as ok", [request.rows[0]!.id, actorId])).rows[0]?.ok, false);
  await db.query("select public.shoe_import_donations($1,$2,$3::jsonb)", [campaignId, actorId, JSON.stringify([{ ...donation, refundedCents: 1000, status: "partially_refunded" }])]);
  const refund = await db.query<{ refunded_cents: number }>("select refunded_cents from public.shoe_donations where id = $1", [donationId.rows[0]!.id]);
  assert.equal(refund.rows[0]?.refunded_cents, 1000);
});

test("new annual campaign starts draft without copying requests and staff grants are private", async (context) => {
  const { db } = await setup(context);
  const settings = {
    code: "sfk-2027-spring", name: "Shoes for Kids — Spring", year: 2027,
    status: "draft", physicalDeadline: "2027-04-01T04:59:59Z",
    reservationDays: 7, distributionNote: "Spring break",
    dropoffLocation: "", dropoffHours: "", dropoffContact: "", dropoffInstructions: "",
    zeffyUrl: "", zeffyEmbedUrl: "", showDonationTotal: true, suggestedPairCents: 5000,
  };
  const created = await db.query<{ id: string }>("select public.shoe_save_campaign($1,$2,null,$3::jsonb) as id",
    [chapterId, actorId, JSON.stringify(settings)]);
  const campaign = await db.query<{ status: string; count: number }>(`select c.status, count(r.id)::int as count from public.shoe_campaigns c
    left join public.shoe_requests r on r.campaign_id = c.id where c.id = $1 group by c.status`, [created.rows[0]!.id]);
  assert.equal(campaign.rows[0]?.status, "draft");
  assert.equal(campaign.rows[0]?.count, 0);
  const assigned = await db.query<{ ok: boolean }>("select public.shoe_assign_staff_role($1,$2,'finance',$3) as ok", [chapterId, actorId, actorId]);
  assert.equal(assigned.rows[0]?.ok, true);
  await db.exec("reset role; set role anon;");
  await assert.rejects(() => db.query("select * from public.shoe_staff_roles"), /permission denied/);
  await assert.rejects(() => db.query("select public.shoe_save_campaign(null,null,null,null)"), /permission denied/);
});
