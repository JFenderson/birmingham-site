import Link from "next/link";
import { requireRole } from "@/lib/auth/rbac";
import { CheckInButton } from "./check-in-button";

const ALL_ROLES = [
  "Member",
  "Treasurer",
  "Secretary",
  "Intake Director",
  "Admin",
] as const;

export default async function EventsPage() {
  const { supabase, chapterId, role, user } = await requireRole(ALL_ROLES);

  const { data: events } = await supabase
    .from("events")
    .select("id, title, description, starts_at, location_name, geofence_radius_m")
    .eq("chapter_id", chapterId)
    .eq("is_deleted", false)
    .order("starts_at", { ascending: true });

  const { data: myCheckIns } = await supabase
    .from("attendance_logs")
    .select("event_id")
    .eq("chapter_id", chapterId)
    .eq("profile_id", user.id);
  const checkedInEventIds = new Set((myCheckIns ?? []).map((c) => c.event_id));

  const { data: attendance } = await supabase
    .from("attendance_logs")
    .select("profile_id")
    .eq("chapter_id", chapterId);

  const counts = new Map<string, number>();
  for (const row of attendance ?? []) {
    counts.set(row.profile_id, (counts.get(row.profile_id) ?? 0) + 1);
  }
  const topProfileIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  const { data: profiles } =
    topProfileIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", topProfileIds)
      : { data: [] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div className="max-w-3xl space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Events</h1>
        {(role === "Admin" || role === "Secretary") && (
          <Link
            href="/events/new"
            className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark"
          >
            New Event
          </Link>
        )}
      </div>

      {!events || events.length === 0 ? (
        <p className="text-sm text-zinc-500">No events scheduled yet.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between rounded-md border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div>
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-zinc-500">
                  {new Date(event.starts_at).toLocaleString()}
                  {event.location_name ? ` · ${event.location_name}` : ""}
                </p>
              </div>
              {event.geofence_radius_m !== null ? (
                <CheckInButton
                  eventId={event.id}
                  alreadyCheckedIn={checkedInEventIds.has(event.id)}
                />
              ) : (
                <span className="text-xs text-zinc-400">Check-in not enabled</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold">Attendance Leaderboard</h2>
        {topProfileIds.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No check-ins yet.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {topProfileIds.map((id, i) => (
              <li
                key={id}
                className="flex items-center justify-between rounded-md border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-800"
              >
                <span>
                  <span className="mr-2 font-semibold text-navy">#{i + 1}</span>
                  {nameById.get(id) ?? "Unknown"}
                </span>
                <span className="text-zinc-500">{counts.get(id)} check-ins</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
