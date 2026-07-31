"use server";

import { revalidatePath } from "next/cache";
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

export async function createEvent(
  input: Record<string, unknown>
): Promise<{ error: string | null }> {
  const { supabase, chapterId, user } = await requireRole(OFFICER_ROLES);

  const parsed = eventFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }
  const data = parsed.data;

  const { error } = await supabase.from("events").insert({
    chapter_id: chapterId,
    title: data.title,
    description: data.description || null,
    starts_at: new Date(data.startsAt).toISOString(),
    location_name: data.locationName || null,
    geofence_lat: data.geofenceLat ?? null,
    geofence_lng: data.geofenceLng ?? null,
    geofence_radius_m: data.geofenceRadiusM ?? null,
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
  const { supabase, chapterId, user } = await requireRole(ALL_ROLES);

  const parsed = checkInSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Location data missing or invalid." };
  }
  const { eventId, lat, lng } = parsed.data;

  // Re-fetch the event scoped to the caller's own chapter — never trust
  // eventId alone; a member could pass any UUID.
  const { data: event } = await supabase
    .from("events")
    .select("id, geofence_lat, geofence_lng, geofence_radius_m")
    .eq("id", eventId)
    .eq("chapter_id", chapterId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (!event) return { error: "Event not found." };

  if (
    event.geofence_lat === null ||
    event.geofence_lng === null ||
    event.geofence_radius_m === null
  ) {
    return { error: "This event does not have check-in enabled." };
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
