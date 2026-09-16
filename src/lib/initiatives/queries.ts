import { createAdminClient } from "@/lib/supabase/admin";
import { monthlyTotals, rankInitiativePeople } from "./tracker";

export async function getInitiativeSnapshot(chapterId: string, month: string) {
  const start = `${month}-01`;
  const end = new Date(`${month}-01T00:00:00Z`); end.setUTCMonth(end.getUTCMonth() + 1);
  const { data } = await createAdminClient().from("initiative_submissions" as never).select("initiative, first_name, last_name, amount_cents, duration_minutes, steps").eq("chapter_id", chapterId).eq("review_status", "approved").eq("is_deleted", false).or(`and(initiative.eq.steps,tracked_on.gte.${start},tracked_on.lt.${end.toISOString().slice(0, 10)}),and(initiative.eq.black_spending,spent_on.gte.${start},spent_on.lt.${end.toISOString().slice(0, 10)})`);
  const rows = (data ?? []) as Array<{ initiative: string; first_name: string; last_name: string; amount_cents: number | null; duration_minutes: number | null; steps: number | null }>;
  const totals = monthlyTotals(rows.map((row) => ({ initiative: row.initiative, amountCents: row.amount_cents, durationMinutes: row.duration_minutes, steps: row.steps })));
  const rankings = ["black_spending", "steps"].map((initiative) => ({ initiative, people: rankInitiativePeople(rows.filter((r) => r.initiative === initiative).map((r) => ({ firstName: r.first_name, lastName: r.last_name, score: initiative === "steps" ? r.steps ?? 0 : r.amount_cents ?? 0 }))) }));
  return { totals, rankings };
}
