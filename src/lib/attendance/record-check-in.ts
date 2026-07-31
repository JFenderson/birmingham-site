import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Inserts an attendance_logs row using the service-role client. No
 * self-insert RLS policy exists on attendance_logs by design — geofence
 * validation must happen server-side (see checkIn() in
 * src/app/(portal)/events/actions.ts, which calls this only after
 * confirming the caller is within range) rather than being trusted from
 * the client. Kept in lib/, not src/app/**, so the no-restricted-imports
 * ESLint rule keeps the service-role client out of route/page code.
 */
export async function recordCheckIn(params: {
  chapterId: string;
  eventId: string;
  profileId: string;
  lat: number;
  lng: number;
  distanceMeters: number;
}): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { error } = await admin.from("attendance_logs").insert({
    chapter_id: params.chapterId,
    event_id: params.eventId,
    profile_id: params.profileId,
    check_in_lat: params.lat,
    check_in_lng: params.lng,
    distance_from_geofence_m: params.distanceMeters,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You've already checked in to this event." };
    }
    return { error: "Could not record check-in." };
  }

  return { error: null };
}
