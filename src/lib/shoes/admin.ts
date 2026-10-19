import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { readDonationImport, readShoeImport } from "./import";
import { fetchShoeRows } from "./store";
import type { ShoeStaffRole } from "./authorization";

function db() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAdminClient() as any;
}

export async function getShoeAdminData(chapterId: string, campaignId?: string, role: ShoeStaffRole = "director") {
  const database = db();
  const { data: campaigns, error } = await database.from("shoe_campaigns").select("*")
    .eq("chapter_id", chapterId).order("year", { ascending: false }).limit(30);
  if (error) throw error;
  const campaign = campaignId === "new" ? null : campaigns?.find((row: { id: string }) => row.id === campaignId) ?? campaigns?.[0] ?? null;
  if (!campaign) return { campaigns: campaigns ?? [], campaign: null, requests: [], reservations: [], donations: [], allocations: [], purchases: [], distributions: [], audit: [], staff: [], activeReservations: 0 };
  const canReservations = ["super","director","committee"].includes(role);
  const canFinance = ["super","finance"].includes(role);
  const canActivity = ["super","director"].includes(role);
  const [requests, reservations, donations, allocations, purchases, distributions, audit, staff] = await Promise.all([
    fetchShoeRows(database, "shoe_requests", role === "distribution" ? "id,public_ref,school_code,size_system,shoe_size,width,shoe_type,status,received_at,purchased_at,distributed_at,reservation_id,reserved_until" : "*", campaign.id),
    canReservations ? database.from("shoe_reservations").select("id,reference,status,expires_at,created_at,delivery_method,shoe_sponsors(name,email,organization_name),shoe_reservation_items(id,status,request_id,shoe_requests(public_ref,size_system,shoe_size,width,shoe_type))")
      .eq("campaign_id", campaign.id).order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [], error: null }),
    canFinance ? fetchShoeRows(database, "shoe_donations", "*", campaign.id) : Promise.resolve([]),
    canFinance ? fetchShoeRows(database, "shoe_allocations", "*", campaign.id) : Promise.resolve([]),
    canFinance ? fetchShoeRows(database, "shoe_purchases", "*", campaign.id) : Promise.resolve([]),
    fetchShoeRows(database, "shoe_distributions", "*", campaign.id),
    canActivity ? database.from("shoe_audit_logs").select("*").eq("campaign_id", campaign.id).order("created_at", { ascending: false }).limit(30) : Promise.resolve({ data: [], error: null }),
    role === "super" ? database.from("shoe_staff_roles").select("user_id,role,granted_at").eq("chapter_id", chapterId).limit(100) : Promise.resolve({ data: [], error: null }),
  ]);
  for (const result of [reservations, audit, staff]) if (result.error) throw result.error;
  const activeReservations = new Set(requests.filter((row: { status: string; reserved_until: string | null }) => row.status === "reserved" && row.reserved_until && Date.parse(row.reserved_until) > Date.now()).map((row: { reservation_id: string }) => row.reservation_id)).size;
  return { campaigns, campaign, requests, reservations: reservations.data ?? [], donations, allocations, purchases, distributions, audit: audit.data ?? [], staff: staff.data ?? [], activeReservations };
}

export async function importShoeRequests(input: { chapterId: string; campaignId: string; actorId: string; file: File }) {
  const parsed = await readShoeImport(input.file);
  if (parsed.errors.length || !parsed.rows.length) return { error: parsed.errors.join(" ") || "No valid requests found." };
  const database = db();
  const { data: campaign } = await database.from("shoe_campaigns").select("id").eq("id", input.campaignId).eq("chapter_id", input.chapterId).single();
  if (!campaign) return { error: "Campaign unavailable." };
  const { data, error } = await database.rpc("shoe_import_requests", { p_campaign_id: campaign.id, p_actor: input.actorId, p_rows: parsed.rows });
  if (error) return { error: "Import failed. Check references, sizes, and campaign state." };
  return { summary: data as { inserted: number; updated: number; skipped: number } };
}

export async function checkInShoe(input: { chapterId: string; campaignId: string; requestId: string; actorId: string; accepted: boolean; sizeVerified: boolean; widthVerified: boolean; typeVerified: boolean; note: string }) {
  const database = db();
  const { data: campaign } = await database.from("shoe_campaigns").select("id").eq("id", input.campaignId).eq("chapter_id", input.chapterId).single();
  if (!campaign) return false;
  const { data: request } = await database.from("shoe_requests").select("id").eq("id", input.requestId).eq("campaign_id", campaign.id).single();
  if (!request) return false;
  const { data, error } = await database.rpc("shoe_check_in", {
    p_request_id: input.requestId, p_actor: input.actorId, p_accepted: input.accepted,
    p_size_verified: input.sizeVerified, p_width_verified: input.widthVerified,
    p_type_verified: input.typeVerified, p_note: input.note,
  });
  if (error) throw error;
  return data === true;
}

export async function findShoeReservation(input: { chapterId: string; campaignId: string; lookup: string }) {
  const database = db();
  const { data: campaign, error: campaignError } = await database.from("shoe_campaigns").select("id")
    .eq("id", input.campaignId).eq("chapter_id", input.chapterId).single();
  if (campaignError || !campaign) return null;
  const code = /^SFK-CI:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.exec(input.lookup);
  const query = database.from("shoe_reservations")
    .select("id,reference,status,expires_at,created_at,delivery_method,shoe_sponsors(name,email,organization_name),shoe_reservation_items(id,status,request_id,shoe_requests(public_ref,size_system,shoe_size,width,shoe_type))")
    .eq("campaign_id", campaign.id);
  const { data, error } = await (code ? query.eq("id", code[1]) : query.eq("reference", input.lookup.toUpperCase())).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveShoeCampaign(input: {
  chapterId: string; actorId: string; campaignId?: string; code: string; name: string;
  year: number; status: string; physicalDeadline: string; reservationDays: number;
  dropoffLocation: string; dropoffHours: string; dropoffContact: string;
  dropoffInstructions: string; distributionNote: string; zeffyUrl: string; zeffyEmbedUrl: string;
  showDonationTotal: boolean; suggestedPairCents: number;
}) {
  const database = db();
  const payload = {
    code: input.code, name: input.name, year: input.year, status: input.status,
    physicalDeadline: input.physicalDeadline, reservationDays: input.reservationDays,
    dropoffLocation: input.dropoffLocation, dropoffHours: input.dropoffHours,
    dropoffContact: input.dropoffContact, dropoffInstructions: input.dropoffInstructions,
    distributionNote: input.distributionNote,
    zeffyUrl: input.zeffyUrl, zeffyEmbedUrl: input.zeffyEmbedUrl,
    showDonationTotal: input.showDonationTotal, suggestedPairCents: input.suggestedPairCents,
  };
  const { data, error } = await database.rpc("shoe_save_campaign", {
    p_chapter_id: input.chapterId, p_actor: input.actorId,
    p_id: input.campaignId ?? null, p_settings: payload,
  });
  if (error) throw error;
  return data as string;
}

export async function cloneShoeCampaign(input: { chapterId: string; actorId: string; sourceId: string; code: string; year: number; physicalDeadline: string }) {
  const database = db();
  const { data: source, error } = await database.from("shoe_campaigns").select("*")
    .eq("id", input.sourceId).eq("chapter_id", input.chapterId).single();
  if (error || !source) throw new Error("Source campaign unavailable.");
  return saveShoeCampaign({
    chapterId: input.chapterId, actorId: input.actorId, code: input.code,
    name: source.name, year: input.year, status: "draft", physicalDeadline: input.physicalDeadline,
    reservationDays: source.reservation_days, dropoffLocation: source.dropoff_location ?? "",
    dropoffHours: source.dropoff_hours ?? "", dropoffContact: source.dropoff_contact ?? "",
    dropoffInstructions: source.dropoff_instructions ?? "", distributionNote: source.distribution_note ?? "",
    zeffyUrl: "", zeffyEmbedUrl: "",
    showDonationTotal: source.show_donation_total, suggestedPairCents: source.suggested_pair_cents,
  });
}

export async function cancelShoeReservationAsAdmin(input: { chapterId: string; campaignId: string; reservationId: string; actorId: string }) {
  const database = db();
  const { data: campaign } = await database.from("shoe_campaigns").select("id").eq("id", input.campaignId).eq("chapter_id", input.chapterId).single();
  if (!campaign) return false;
  const { data: reservation } = await database.from("shoe_reservations").select("id").eq("id", input.reservationId).eq("campaign_id", campaign.id).single();
  if (!reservation) return false;
  const { data, error } = await database.rpc("shoe_cancel_reservation", { p_id: reservation.id, p_actor: input.actorId });
  if (error) throw error;
  return data === true;
}

export async function extendShoeReservation(input: { chapterId: string; campaignId: string; reservationId: string; actorId: string; until: string }) {
  const database = db();
  const { data: campaign } = await database.from("shoe_campaigns").select("id").eq("id", input.campaignId).eq("chapter_id", input.chapterId).single();
  if (!campaign) return false;
  const { data: reservation } = await database.from("shoe_reservations").select("id").eq("id", input.reservationId).eq("campaign_id", campaign.id).single();
  if (!reservation) return false;
  const { data, error } = await database.rpc("shoe_extend_reservation", { p_id: reservation.id, p_actor: input.actorId, p_until: input.until });
  if (error) throw error;
  return data === true;
}

export async function importShoeDonations(input: { chapterId: string; campaignId: string; actorId: string; file: File }) {
  const rows = await readDonationImport(input.file);
  const database = db();
  const { data: campaign } = await database.from("shoe_campaigns").select("id").eq("id", input.campaignId).eq("chapter_id", input.chapterId).single();
  if (!campaign) throw new Error("Campaign unavailable.");
  const { data, error } = await database.rpc("shoe_import_donations", { p_campaign_id: campaign.id, p_actor: input.actorId, p_rows: rows });
  if (error) throw error;
  return data as { processed: number };
}

export async function allocateShoeDonation(input: { chapterId: string; campaignId: string; actorId: string; donationId: string; requestId: string | null; amountCents: number }) {
  const database = db();
  const { data: campaign } = await database.from("shoe_campaigns").select("id").eq("id", input.campaignId).eq("chapter_id", input.chapterId).single();
  if (!campaign) return false;
  const { data, error } = await database.rpc("shoe_allocate_funds", {
    p_campaign_id: campaign.id, p_actor: input.actorId, p_donation_id: input.donationId,
    p_request_id: input.requestId, p_amount_cents: input.amountCents,
  });
  if (error) throw error;
  return data === true;
}

export async function recordShoePurchase(input: { chapterId: string; campaignId: string; requestId: string; actorId: string; costCents: number; allocationId: string | null; note: string }) {
  const database = db();
  const { data: campaign } = await database.from("shoe_campaigns").select("id").eq("id", input.campaignId).eq("chapter_id", input.chapterId).single();
  if (!campaign) return false;
  const { data: request } = await database.from("shoe_requests").select("id").eq("id", input.requestId).eq("campaign_id", campaign.id).single();
  if (!request) return false;
  const { data, error } = await database.rpc("shoe_record_purchase", {
    p_request_id: request.id, p_actor: input.actorId, p_cost_cents: input.costCents,
    p_allocation_id: input.allocationId, p_note: input.note,
  });
  if (error) throw error;
  return data === true;
}

export async function recordShoeDistribution(input: { chapterId: string; campaignId: string; requestId: string; actorId: string; deliveryReference: string }) {
  const database = db();
  const { data: campaign } = await database.from("shoe_campaigns").select("id").eq("id", input.campaignId).eq("chapter_id", input.chapterId).single();
  if (!campaign) return false;
  const { data: request } = await database.from("shoe_requests").select("id").eq("id", input.requestId).eq("campaign_id", campaign.id).single();
  if (!request) return false;
  const { data, error } = await database.rpc("shoe_distribute", {
    p_request_id: request.id, p_actor: input.actorId, p_delivery_reference: input.deliveryReference,
  });
  if (error) throw error;
  return data === true;
}

export async function assignShoeStaffRole(input: { chapterId: string; actorId: string; userId: string; role: "director" | "committee" | "finance" | "distribution" }) {
  const database = db();
  const { data, error } = await database.rpc("shoe_assign_staff_role", {
    p_chapter_id: input.chapterId, p_user_id: input.userId,
    p_role: input.role, p_actor: input.actorId,
  });
  if (error) throw error;
  return data === true;
}
