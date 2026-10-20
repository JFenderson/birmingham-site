"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireShoeRole, type ShoeStaffRole } from "@/lib/shoes/authorization";
import { readShoeImport } from "@/lib/shoes/import";
import {
  allocateShoeDonation, assignShoeStaffRole, cancelShoeReservationAsAdmin, checkInShoe,
  cloneShoeCampaign, extendShoeReservation, findShoeReservation, importShoeDonations,
  importShoeRequests, recordShoeDistribution, recordShoePurchase, saveShoeCampaign,
} from "@/lib/shoes/admin";

async function context(allowed: readonly ShoeStaffRole[]) {
  const staff = await requireShoeRole(allowed);
  return { actorId: staff.member.user.id, chapterId: staff.chapterId };
}

function refresh() {
  revalidatePath("/admin/shoes-for-kids");
  revalidatePath("/shoes-for-kids");
}

function centralEndOfDay(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Choose a valid deadline date.");
  const midday = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(midday.getTime())) throw new Error("Choose a valid deadline date.");
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", timeZoneName: "shortOffset" })
    .formatToParts(midday).find((part) => part.type === "timeZoneName")?.value;
  const hours = Number(/^GMT([+-]\d+)$/.exec(offset ?? "")?.[1]);
  if (!Number.isFinite(hours)) throw new Error("Unable to resolve Central Time.");
  const [year = 0, month = 0, day = 0] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 23 - hours, 59, 59)).toISOString();
}

function zeffyUrl(value: string) {
  if (!value) return "";
  const url = new URL(value);
  if (url.protocol !== "https:" || !(url.hostname === "zeffy.com" || url.hostname.endsWith(".zeffy.com"))) throw new Error("Use an official HTTPS Zeffy URL.");
  return url.toString();
}

const campaignSchema = z.object({
  campaignId: z.string().uuid().optional(), code: z.string().regex(/^[a-z0-9-]{4,60}$/),
  name: z.string().trim().min(5).max(160), year: z.coerce.number().int().min(2026).max(2100),
  status: z.enum(["draft","published","paused","closed","archived"]),
  deadlineDate: z.string(), reservationDays: z.coerce.number().int().min(1).max(365),
  dropoffLocation: z.string().trim().max(300), dropoffHours: z.string().trim().max(300),
  dropoffContact: z.string().trim().max(300), dropoffInstructions: z.string().trim().max(1000),
  distributionNote: z.string().trim().max(300),
  zeffyUrl: z.string().trim(), zeffyEmbedUrl: z.string().trim(),
  showDonationTotal: z.boolean(), suggestedPairDollars: z.coerce.number().min(1).max(10000),
});

export async function saveCampaignAction(form: FormData) {
  const scope = await context(["director"]);
  const parsed = campaignSchema.safeParse({
    ...Object.fromEntries(form), showDonationTotal: form.get("showDonationTotal") === "on",
    campaignId: form.get("campaignId") || undefined,
  });
  if (!parsed.success) return { error: "Check campaign settings and try again." };
  try {
    const data = parsed.data;
    const id = await saveShoeCampaign({
      ...scope, ...(data.campaignId ? { campaignId: data.campaignId } : {}), code: data.code, name: data.name,
      year: data.year, status: data.status, physicalDeadline: centralEndOfDay(data.deadlineDate),
      reservationDays: data.reservationDays, dropoffLocation: data.dropoffLocation,
      dropoffHours: data.dropoffHours, dropoffContact: data.dropoffContact,
      dropoffInstructions: data.dropoffInstructions, distributionNote: data.distributionNote,
      zeffyUrl: zeffyUrl(data.zeffyUrl),
      zeffyEmbedUrl: zeffyUrl(data.zeffyEmbedUrl), showDonationTotal: data.showDonationTotal,
      suggestedPairCents: Math.round(data.suggestedPairDollars * 100),
    });
    refresh(); return { success: `Campaign saved (${id}).` };
  } catch { return { error: "Could not save campaign. Check the code, dates, and Zeffy URLs." }; }
}

export async function cloneCampaignAction(form: FormData) {
  const scope = await context(["director"]);
  const parsed = z.object({ sourceId: z.string().uuid(), code: z.string().regex(/^[a-z0-9-]{4,60}$/), year: z.coerce.number().int().min(2026).max(2100), deadlineDate: z.string() }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Check clone settings." };
  try {
    await cloneShoeCampaign({ ...scope, sourceId: parsed.data.sourceId, code: parsed.data.code, year: parsed.data.year, physicalDeadline: centralEndOfDay(parsed.data.deadlineDate) });
    refresh(); return { success: "New draft campaign created. Requests and donations were not copied." };
  } catch { return { error: "Could not clone campaign. The new code may already exist." }; }
}

export async function previewImportAction(form: FormData) {
  await context(["director"]);
  const file = form.get("file");
  if (!(file instanceof File)) return { error: "Choose a CSV or XLSX file." };
  try {
    const parsed = await readShoeImport(file);
    return parsed.errors.length ? { error: parsed.errors.join(" ") } : {
      success: `${parsed.rows.length} individual pairs validated. Existing available records will be updated; reserved or fulfilled records will be skipped.`,
      rows: parsed.rows.slice(0, 12),
    };
  } catch (error) { return { error: error instanceof Error ? error.message : "Unable to read import file." }; }
}

export async function commitImportAction(form: FormData) {
  const scope = await context(["director"]);
  const file = form.get("file"), campaignId = form.get("campaignId");
  if (!(file instanceof File) || typeof campaignId !== "string" || !z.uuid().safeParse(campaignId).success) return { error: "Choose a valid campaign and file." };
  try {
    const result = await importShoeRequests({ ...scope, campaignId, file });
    if (result.error) return { error: result.error };
    refresh(); return { success: `Imported ${result.summary?.inserted} new, updated ${result.summary?.updated}, skipped ${result.summary?.skipped} protected requests.` };
  } catch { return { error: "Import failed. No batch changes were committed." }; }
}

export async function checkInAction(form: FormData) {
  const scope = await context(["director", "committee"]);
  const parsed = z.object({ campaignId: z.uuid(), requestId: z.uuid(), accepted: z.enum(["yes","no"]), note: z.string().max(500) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Invalid check-in details." };
  if (parsed.data.accepted === "yes" && ["sizeVerified", "widthVerified", "typeVerified"].some((field) => form.get(field) !== "on")) {
    return { error: "Verify the size, width, and shoe type before accepting this pair." };
  }
  if (parsed.data.accepted === "no" && !parsed.data.note.trim()) return { error: "Describe the condition or mismatch for review." };
  try {
    const result = await checkInShoe({ ...scope, campaignId: parsed.data.campaignId, requestId: parsed.data.requestId,
      accepted: parsed.data.accepted === "yes", sizeVerified: form.get("sizeVerified") === "on",
      widthVerified: form.get("widthVerified") === "on", typeVerified: form.get("typeVerified") === "on", note: parsed.data.note });
    if (!result) return { error: "This pair has already been processed or is no longer reserved." };
    refresh(); return { success: parsed.data.accepted === "yes" ? "Pair accepted and received." : "Pair flagged for review." };
  } catch { return { error: "Check-in failed. Review the pair and try again." }; }
}

export async function lookupShoeReservationAction(form: FormData) {
  const scope = await context(["director", "committee"]);
  const parsed = z.object({ campaignId: z.uuid(), lookup: z.string().trim().min(5).max(80) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Enter a valid reservation reference or scan a check-in QR code." };
  try {
    const reservation = await findShoeReservation({ chapterId: scope.chapterId, campaignId: parsed.data.campaignId, lookup: parsed.data.lookup });
    return reservation ? { reservation } : { error: "No reservation with that reference or QR code was found in this campaign." };
  } catch { return { error: "Reservation lookup is unavailable. Please try again." }; }
}

export async function reservationAdminAction(form: FormData) {
  const scope = await context(["director", "committee"]);
  const parsed = z.object({ campaignId: z.uuid(), reservationId: z.uuid(), operation: z.enum(["cancel","extend"]), until: z.string().optional() }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Invalid reservation action." };
  try {
    const common = { ...scope, campaignId: parsed.data.campaignId, reservationId: parsed.data.reservationId };
    const done = parsed.data.operation === "cancel" ? await cancelShoeReservationAsAdmin(common)
      : await extendShoeReservation({ ...common, until: centralEndOfDay(parsed.data.until ?? "") });
    if (!done) return { error: "Reservation cannot be changed in its current state." };
    refresh(); return { success: "Reservation updated." };
  } catch { return { error: "Reservation update failed." }; }
}

export async function importDonationsAction(form: FormData) {
  const scope = await context(["finance"]);
  const file = form.get("file"), campaignId = form.get("campaignId");
  if (!(file instanceof File) || typeof campaignId !== "string" || !z.uuid().safeParse(campaignId).success) return { error: "Choose a valid campaign and CSV." };
  try {
    const result = await importShoeDonations({ ...scope, campaignId, file });
    refresh(); return { success: `${result.processed} Zeffy transactions reconciled by transaction ID.` };
  } catch (error) { return { error: error instanceof Error ? error.message : "Donation import failed." }; }
}

export async function allocateDonationAction(form: FormData) {
  const scope = await context(["finance"]);
  const parsed = z.object({ campaignId: z.uuid(), donationId: z.uuid(), requestId: z.union([z.uuid(), z.literal("")]), amountDollars: z.coerce.number().positive().max(100000) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Invalid allocation." };
  try {
    const done = await allocateShoeDonation({ ...scope, campaignId: parsed.data.campaignId, donationId: parsed.data.donationId,
      requestId: parsed.data.requestId || null, amountCents: Math.round(parsed.data.amountDollars * 100) });
    if (!done) return { error: "Allocation exceeds verified unallocated funds or request is unavailable." };
    refresh(); return { success: "Verified funds allocated. Shoe fulfillment is unchanged until shoes are purchased or received." };
  } catch { return { error: "Allocation failed." }; }
}

export async function purchaseShoeAction(form: FormData) {
  const scope = await context(["finance"]);
  const parsed = z.object({ campaignId: z.uuid(), requestId: z.uuid(), costDollars: z.coerce.number().positive().max(10000), allocationId: z.union([z.uuid(), z.literal("")]), note: z.string().max(500) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Invalid purchase details." };
  try {
    const done = await recordShoePurchase({ ...scope, campaignId: parsed.data.campaignId, requestId: parsed.data.requestId,
      costCents: Math.round(parsed.data.costDollars * 100), allocationId: parsed.data.allocationId || null, note: parsed.data.note });
    if (!done) return { error: "Purchase cannot be recorded for this request or allocation." };
    refresh(); return { success: "Purchase recorded and pair marked fulfilled." };
  } catch { return { error: "Purchase could not be recorded." }; }
}

export async function distributeShoeAction(form: FormData) {
  const scope = await context(["director", "distribution"]);
  const parsed = z.object({ campaignId: z.uuid(), requestId: z.uuid(), deliveryReference: z.string().trim().min(2).max(120) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Enter a delivery reference." };
  try {
    const done = await recordShoeDistribution({ ...scope, ...parsed.data });
    if (!done) return { error: "Only received or purchased pairs can be distributed." };
    refresh(); return { success: "Distribution recorded." };
  } catch { return { error: "Distribution could not be recorded." }; }
}

export async function assignShoeRoleAction(form: FormData) {
  const scope = await context(["super"]);
  const parsed = z.object({ userId: z.uuid(), role: z.enum(["director","committee","finance","distribution"]) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Enter an approved member ID and campaign role." };
  try {
    const done = await assignShoeStaffRole({ ...scope, ...parsed.data });
    if (!done) return { error: "Member must be approved for the Tau Sigma chapter." };
    refresh(); return { success: "Campaign staff role assigned." };
  } catch { return { error: "Could not assign campaign role." }; }
}
