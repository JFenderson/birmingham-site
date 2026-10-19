import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { shoeGroupKey, type PublicCampaign, type PublicInventoryGroup, type PublicProgress, type PublicShoeRequest, type ShoeReservationInput } from "./model";

// The generated database types are updated after the migration is applied.
// Keep new server-only tables out of the browser client in the meantime.
function db() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAdminClient() as any;
}

export function hashShoeToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newShoeToken() {
  return randomBytes(32).toString("base64url");
}

export async function getPublicShoePortal(chapterId: string) {
  const database = db();
  const { data: campaigns, error } = await database.from("shoe_campaigns")
    .select("id,code,name,year,status,physical_deadline,dropoff_location,dropoff_hours,dropoff_contact,dropoff_instructions,zeffy_url,zeffy_embed_url,suggested_pair_cents,show_donation_total")
    .eq("chapter_id", chapterId).order("year", { ascending: false }).limit(10);
  if (error) throw error;
  const chosen = campaigns?.find((row: { status: string }) => row.status === "published") ?? campaigns?.find((row: { code: string }) => row.code === "sfk-2026");
  if (!chosen) return { campaign: null, requests: [], inventoryGroups: [], progress: null };
  const campaign: PublicCampaign = {
    id: chosen.id, code: chosen.code, name: chosen.name, year: chosen.year, status: chosen.status,
    physicalDeadline: chosen.physical_deadline, dropoffLocation: chosen.dropoff_location,
    dropoffHours: chosen.dropoff_hours, dropoffContact: chosen.dropoff_contact,
    dropoffInstructions: chosen.dropoff_instructions, zeffyUrl: chosen.zeffy_url,
    zeffyEmbedUrl: chosen.zeffy_embed_url, suggestedPairCents: chosen.suggested_pair_cents,
    showDonationTotal: chosen.show_donation_total,
  };
  if (campaign.status !== "published") return {
    campaign: {
      ...campaign,
      dropoffLocation: null,
      dropoffHours: null,
      dropoffContact: null,
      dropoffInstructions: null,
      zeffyUrl: campaign.status === "draft" ? campaign.zeffyUrl : null,
      zeffyEmbedUrl: campaign.status === "draft" ? campaign.zeffyEmbedUrl : null,
      showDonationTotal: false,
    },
    requests: [], inventoryGroups: [], progress: null,
  };
  const [all, donations] = await Promise.all([
    fetchShoeRows(database, "shoe_requests", "id,public_ref,grade_level,gender,size_system,shoe_size,width,shoe_type,status,reserved_until,received_at,purchased_at", campaign.id),
    fetchShoeRows(database, "shoe_donations", "amount_cents,refunded_cents,payment_status", campaign.id),
  ]);
  const currentRequests = all.filter((row: { status: string }) => row.status !== "cancelled");
  const now = Date.now();
  const requests: PublicShoeRequest[] = currentRequests.filter((row: { status: string; reserved_until: string | null }) =>
    row.status === "available" || (row.status === "reserved" && row.reserved_until && Date.parse(row.reserved_until) <= now)
  ).map((row: { id: string; public_ref: string; grade_level: string | null; gender: string | null; size_system: string; shoe_size: string; width: string; shoe_type: string }) => ({
    id: row.id, publicRef: row.public_ref, gradeLevel: row.grade_level, gender: row.gender, sizeSystem: row.size_system,
    shoeSize: row.shoe_size, width: row.width, shoeType: row.shoe_type,
  }));
  const inventory = new Map<string, PublicInventoryGroup>();
  const availableIds = new Set(requests.map((request) => request.id));
  for (const row of currentRequests) {
    const key = shoeGroupKey({ gradeLevel: row.grade_level, gender: row.gender, sizeSystem: row.size_system, shoeSize: row.shoe_size, width: row.width, shoeType: row.shoe_type });
    const existing = inventory.get(key);
    if (existing) { existing.needed++; if (availableIds.has(row.id)) existing.count++; }
    else inventory.set(key, { key, request: {
      id: row.id, publicRef: row.public_ref, gradeLevel: row.grade_level, gender: row.gender, sizeSystem: row.size_system,
      shoeSize: row.shoe_size, width: row.width, shoeType: row.shoe_type,
    }, count: availableIds.has(row.id) ? 1 : 0, needed: 1 });
  }
  const fulfilled = currentRequests.filter((row: { status: string }) => ["received", "purchased", "distributed"].includes(row.status)).length;
  const reserved = currentRequests.filter((row: { status: string; reserved_until: string | null }) => row.status === "reserved" && !!row.reserved_until && Date.parse(row.reserved_until) > now).length;
  const progress: PublicProgress = {
    requested: currentRequests.length, fulfilled, reserved,
    outstanding: currentRequests.length - fulfilled,
    received: currentRequests.filter((row: { received_at: string | null }) => !!row.received_at).length,
    purchased: currentRequests.filter((row: { purchased_at: string | null }) => !!row.purchased_at).length,
    donationsCents: campaign.showDonationTotal ? donations
      .filter((row: { payment_status: string }) => ["succeeded", "refunded", "partially_refunded"].includes(row.payment_status))
      .reduce((sum: number, row: { amount_cents: number; refunded_cents: number }) => sum + row.amount_cents - row.refunded_cents, 0) : null,
  };
  return { campaign, requests, inventoryGroups: [...inventory.values()].sort((a,b) => a.key.localeCompare(b.key, undefined, { numeric: true })), progress };
}

// Explicit pagination avoids the Data API's project-level maximum row count
// silently truncating public progress or annual reports.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchShoeRows(database: any, table: string, columns: string, campaignId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = [];
  for (let offset = 0; offset < 50_000; offset += 500) {
    const { data, error } = await database.from(table).select(columns).eq("campaign_id", campaignId).order("id").range(offset, offset + 499);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 500) return rows;
  }
  throw new Error("Campaign data exceeds supported pagination limit.");
}

export async function createShoeReservation(chapterId: string, input: ShoeReservationInput) {
  const database = db();
  const { data: campaign, error: campaignError } = await database.from("shoe_campaigns")
    .select("id,status,physical_deadline").eq("id", input.campaignId).eq("chapter_id", chapterId).single();
  if (campaignError || !campaign || campaign.status !== "published" || Date.parse(campaign.physical_deadline) <= Date.now()) {
    throw new Error("Campaign is not accepting reservations.");
  }
  const token = newShoeToken();
  const { data, error } = await database.rpc("shoe_reserve", {
    p_campaign_id: campaign.id,
    p_sponsor: {
      name: input.name, email: input.email, phone: input.phone ?? "",
      sponsorType: input.sponsorType, organizationName: input.organizationName ?? "",
      recognitionConsent: input.recognitionConsent,
    },
    p_selections: input.selections,
    p_token_hash: hashShoeToken(token),
    p_delivery_method: input.deliveryMethod,
  });
  if (error) {
    if (error.message.includes("INVENTORY_CHANGED")) throw new Error("Some pairs were just reserved by another sponsor. Refresh availability and choose again.");
    throw error;
  }
  return { token, reference: data.reference as string, expiresAt: data.expiresAt as string, checkInCode: `SFK-CI:${data.id as string}` };
}

export async function getShoeReservationByToken(chapterId: string, token: string) {
  if (!/^[A-Za-z0-9_-]{40,80}$/.test(token)) return null;
  const database = db();
  const { data: reservation } = await database.from("shoe_reservations")
    .select("id,reference,status,expires_at,created_at,campaign_id,delivery_method,shoe_campaigns!inner(chapter_id,physical_deadline,dropoff_location,dropoff_hours,dropoff_contact,dropoff_instructions),shoe_sponsors!inner(name,email,organization_name)")
    .eq("management_token_hash", hashShoeToken(token))
    .gt("management_token_expires_at", new Date().toISOString()).single();
  if (!reservation || reservation.shoe_campaigns.chapter_id !== chapterId) return null;
  const { data: items } = await database.from("shoe_reservation_items")
    .select("status,shoe_requests!inner(id,public_ref,size_system,shoe_size,width,shoe_type)")
    .eq("reservation_id", reservation.id);
  return { ...reservation, items: items ?? [] };
}

export async function cancelShoeReservation(chapterId: string, token: string) {
  const reservation = await getShoeReservationByToken(chapterId, token);
  if (!reservation) return false;
  const { data, error } = await db().rpc("shoe_cancel_reservation", { p_id: reservation.id, p_actor: null });
  if (error) throw error;
  return data === true;
}
