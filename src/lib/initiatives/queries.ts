import { createAdminClient } from "@/lib/supabase/admin";
import { formatPublicName, monthlyTotals } from "./tracker";

export async function getInitiativeSnapshot(chapterId: string, month: string) {
  const start = `${month}-01`;
  const end = new Date(`${month}-01T00:00:00Z`); end.setUTCMonth(end.getUTCMonth() + 1);
  const { data } = await createAdminClient().from("initiative_submissions" as never).select("initiative, first_name, last_name, amount_cents, duration_minutes, steps").eq("chapter_id", chapterId).eq("is_deleted", false).gte("created_at", start).lt("created_at", end.toISOString());
  const rows = (data ?? []) as Array<{ initiative: string; first_name: string; last_name: string; amount_cents: number | null; duration_minutes: number; steps: number | null }>;
  const totals = monthlyTotals(rows.map((row) => ({ initiative: row.initiative, amountCents: row.amount_cents, durationMinutes: row.duration_minutes, steps: row.steps })));
  const rankings = ["black_spending", "steps"].map((initiative) => ({ initiative, people: rows.filter((r) => r.initiative === initiative).map((r) => ({ name: formatPublicName(r.first_name, r.last_name), score: initiative === "steps" ? r.steps ?? 0 : r.amount_cents ?? 0 })).sort((a, b) => b.score - a.score).slice(0, 10) }));
  return { totals, rankings };
}
