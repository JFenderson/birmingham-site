import Link from "next/link";
import { CalendarDays, MapPin, Trophy } from "lucide-react";
import { PortalCard } from "@/components/portal/portal-card";
import { PortalEmptyState } from "@/components/portal/portal-empty-state";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { PortalStatusBadge } from "@/components/portal/portal-status-badge";
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
  const canCreateEvent = role === "Admin" || role === "Secretary";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <PortalPageHeader
        eyebrow="Chapter Calendar"
        title="Events"
        description="Stay current on chapter meetings, service projects, and check-in enabled gatherings from a mobile-friendly schedule."
        badge={
          <PortalStatusBadge variant={events && events.length > 0 ? "success" : "neutral"}>
            {events && events.length > 0 ? `${events.length} scheduled` : "Nothing scheduled"}
          </PortalStatusBadge>
        }
        action={
          canCreateEvent ? (
            <Link
              href="/events/new"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark"
            >
              New Event
            </Link>
          ) : null
        }
      />

      {!events || events.length === 0 ? (
        <PortalEmptyState
          title="No events scheduled yet"
          description="When chapter events are published, they will appear here with date, location, and check-in access."
          action={
            canCreateEvent ? (
              <Link
                href="/events/new"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark"
              >
                Schedule the first event
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
          <div className="space-y-4">
            {events.map((event) => (
              <PortalCard
                key={event.id}
                as="article"
                className="space-y-4 rounded-[2rem] p-5 sm:p-6"
                variant="elevated"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <PortalStatusBadge variant="info">
                        {new Date(event.starts_at).toLocaleDateString()}
                      </PortalStatusBadge>
                      {event.geofence_radius_m !== null ? (
                        <PortalStatusBadge variant="success">Check-in enabled</PortalStatusBadge>
                      ) : (
                        <PortalStatusBadge variant="neutral">Attendance only</PortalStatusBadge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                        {event.title}
                      </h2>
                      {event.description ? (
                        <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                          {event.description}
                        </p>
                      ) : null}
                    </div>

                    <dl className="grid gap-3 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
                      <div className="flex items-start gap-2">
                        <CalendarDays className="mt-0.5 size-4 shrink-0 text-navy dark:text-blue-300" aria-hidden="true" />
                        <div>
                          <dt className="font-medium text-zinc-950 dark:text-zinc-100">Starts</dt>
                          <dd>{new Date(event.starts_at).toLocaleString()}</dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-navy dark:text-blue-300" aria-hidden="true" />
                        <div>
                          <dt className="font-medium text-zinc-950 dark:text-zinc-100">Location</dt>
                          <dd>{event.location_name ?? "To be announced"}</dd>
                        </div>
                      </div>
                    </dl>
                  </div>

                  <div className="sm:shrink-0">
                    {event.geofence_radius_m !== null ? (
                      <CheckInButton
                        eventId={event.id}
                        alreadyCheckedIn={checkedInEventIds.has(event.id)}
                      />
                    ) : (
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        Check-in not enabled
                      </span>
                    )}
                  </div>
                </div>
              </PortalCard>
            ))}
          </div>

          <PortalCard as="section" className="space-y-4 rounded-[2rem] p-5 sm:p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-navy/8 text-navy dark:bg-blue-400/10 dark:text-blue-200">
                  <Trophy className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                    Attendance Leaderboard
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Top check-in activity across the chapter.
                  </p>
                </div>
              </div>
            </div>

            {topProfileIds.length === 0 ? (
              <PortalEmptyState
                title="No check-ins yet"
                description="Attendance will start ranking here once members begin checking in at geofenced events."
                className="border-none bg-transparent p-0 shadow-none"
              />
            ) : (
              <ol className="space-y-3">
                {topProfileIds.map((id, i) => (
                  <li
                    key={id}
                    className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800"
                  >
                    <span className="min-w-0">
                      <span className="mr-2 font-semibold text-navy dark:text-blue-300">#{i + 1}</span>
                      {nameById.get(id) ?? "Unknown"}
                    </span>
                    <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                      {counts.get(id)} check-ins
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </PortalCard>
        </div>
      )}
    </div>
  );
}
