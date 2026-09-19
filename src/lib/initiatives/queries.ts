import { createAdminClient } from "@/lib/supabase/admin";
import { monthlyTotals, rankInitiativePeople } from "./tracker";
import type { InitiativeReportRow } from "./report";

function monthlyInitiativeFilter(month: string): string {
  const start = `${month}-01`;
  const end = new Date(`${month}-01T00:00:00Z`);
  end.setUTCMonth(end.getUTCMonth() + 1);
  const endDate = end.toISOString().slice(0, 10);
  return `and(initiative.eq.steps,tracked_on.gte.${start},tracked_on.lt.${endDate}),and(initiative.eq.black_spending,spent_on.gte.${start},spent_on.lt.${endDate})`;
}

export async function getApprovedInitiativeReport(chapterId: string, month: string) {
  const { data, error } = await createAdminClient()
    .from("initiative_submissions" as never)
    .select("initiative, first_name, last_name, business_name, amount_cents, spent_on, steps, distance_miles, tracked_on, duration_minutes, steps_source, reviewed_at")
    .eq("chapter_id", chapterId)
    .eq("review_status", "approved")
    .eq("is_deleted", false)
    .or(monthlyInitiativeFilter(month))
    .order("initiative")
    .order("tracked_on", { ascending: true });

  if (error) throw new Error("Could not load the initiative report.");

  const entries = (data ?? []) as Array<{
    initiative: string;
    first_name: string;
    last_name: string;
    business_name: string | null;
    amount_cents: number | null;
    spent_on: string | null;
    steps: number | null;
    distance_miles: number | null;
    tracked_on: string | null;
    duration_minutes: number | null;
    steps_source: string | null;
    reviewed_at: string | null;
  }>;
  const totals = monthlyTotals(entries.map((entry) => ({
    initiative: entry.initiative,
    amountCents: entry.amount_cents,
    durationMinutes: entry.duration_minutes,
    steps: entry.steps,
  })));
  const rankings = ["black_spending", "steps"].map((initiative) => ({
    initiative,
    people: rankInitiativePeople(entries.filter((entry) => entry.initiative === initiative).map((entry) => ({
      firstName: entry.first_name,
      lastName: entry.last_name,
      score: initiative === "steps" ? entry.steps ?? 0 : entry.amount_cents ?? 0,
    }))),
  }));
  const reportEntries: InitiativeReportRow[] = entries.map((entry) => ({
    initiative: entry.initiative,
    firstName: entry.first_name,
    lastName: entry.last_name,
    businessName: entry.business_name,
    amountCents: entry.amount_cents,
    spentOn: entry.spent_on,
    steps: entry.steps,
    distanceMiles: entry.distance_miles,
    trackedOn: entry.tracked_on,
    durationMinutes: entry.duration_minutes,
    stepsSource: entry.steps_source,
    reviewedAt: entry.reviewed_at,
  }));

  return { totals, rankings, entries: reportEntries };
}

export async function getInitiativeSnapshot(chapterId: string, month: string) {
  const report = await getApprovedInitiativeReport(chapterId, month);
  return { totals: report.totals, rankings: report.rankings };
}
