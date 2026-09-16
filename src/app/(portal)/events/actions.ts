"use server";

import { revalidatePath } from "next/cache";
import { createHmac, timingSafeEqual } from "node:crypto";
import { requireRole } from "@/lib/auth/rbac";
import { recordCheckIn } from "@/lib/attendance/record-check-in";
import { eventFormSchema, checkInSchema } from "@/lib/validation/schemas";

const OFFICER_ROLES = ["Admin", "Secretary"] as const;
const ALL_ROLES = [
  "Member",
  "Treasurer",
  "Secretary",
  "Intake Director",
  "Admin",
] as const;

function checkInCodeHash(code: string): string | null {
  const pepper = process.env.CHECK_IN_CODE_PEPPER;
  return pepper ? createHmac("sha256", pepper).update(code).digest("hex") : null;
}

export async function createEvent(
  input: Record<string, unknown>
): Promise<{ error: string | null }> {
  const { supabase, chapterId, user } = await requireRole(OFFICER_ROLES);

  const parsed = eventFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }
  const data = parsed.data;
  const codeHash = data.geofenceLat === undefined ? null : checkInCodeHash(data.checkInCode ?? "");
  if (data.geofenceLat !== undefined && !codeHash) {
    return { error: "Check-in is unavailable until CHECK_IN_CODE_PEPPER is configured." };
  }

  const { error } = await (supabase.from("events") as any).insert({
    chapter_id: chapterId,
    title: data.title,
    description: data.description || null,
    starts_at: new Date(data.startsAt).toISOString(),
    location_name: data.locationName || null,
    geofence_lat: data.geofenceLat ?? null,
    geofence_lng: data.geofenceLng ?? null,
    geofence_radius_m: data.geofenceRadiusM ?? null,
    check_in_code_hash: codeHash,
    created_by: user.id,
  });

  if (error) return { error: "Could not create event." };

  revalidatePath("/events");
  return { error: null };
}

/** Haversine great-circle distance in meters. */
function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function checkIn(
  input: Record<string, unknown>
): Promise<{ error: string | null }> {
  const { supabase, chapterId, user } = await requireRole(ALL_ROLES, { requireMfa: false });

  const parsed = checkInSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Location data missing or invalid." };
  }
  const { eventId, lat, lng } = parsed.data;

  // Re-fetch the event scoped to the caller's own chapter — never trust
  // eventId alone; a member could pass any UUID.
  const { data: event } = await (supabase
    .from("events") as any)
    .select("id, starts_at, geofence_lat, geofence_lng, geofence_radius_m, check_in_code_hash")
    .eq("id", eventId)
    .eq("chapter_id", chapterId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (!event) return { error: "Event not found." };

  if (
    event.geofence_lat === null ||
    event.geofence_lng === null ||
    event.geofence_radius_m === null || !event.check_in_code_hash
  ) {
    return { error: "This event does not have check-in enabled." };
  }

  const eventStart = new Date(event.starts_at).getTime();
  const now = Date.now();
  if (!Number.isFinite(eventStart) || now < eventStart - 30 * 60_000 || now > eventStart + 4 * 60 * 60_000) {
    return { error: "Check-in is available from 30 minutes before the event until four hours after it starts." };
  }
  const submittedHash = checkInCodeHash(parsed.data.code);
  if (!submittedHash || submittedHash.length !== event.check_in_code_hash.length || !timingSafeEqual(Buffer.from(submittedHash), Buffer.from(event.check_in_code_hash))) {
    return { error: "That check-in code is invalid." };
  }

  const distance = distanceMeters(lat, lng, event.geofence_lat, event.geofence_lng);
  if (distance > event.geofence_radius_m) {
    return { error: "You're too far from the event location to check in." };
  }

  const result = await recordCheckIn({
    chapterId,
    eventId,
    profileId: user.id,
    lat,
    lng,
    distanceMeters: distance,
  });

  if (!result.error) revalidatePath("/events");
  return result;
}
