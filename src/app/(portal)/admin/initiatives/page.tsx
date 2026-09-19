import { requireChapterAdmin } from "@/lib/auth/authorization";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { getInitiativeSnapshot } from "@/lib/initiatives/queries";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { listPendingInitiativeSubmissions } from "@/lib/initiatives/review";
import { approveImportedInitiatives, reviewInitiative } from "./actions";

export default async function InitiativeReportPage() {
  await requireChapterAdmin();
  const { chapterId } = await getTenantContext();
  const month = new Date().toISOString().slice(0, 7);
  const snapshot = await getInitiativeSnapshot(chapterId, month);
  const pending = await listPendingInitiativeSubmissions(chapterId);
  const pendingImportedCount = pending.filter(
    (entry: any) => entry.submission_source === "group_chat_import"
  ).length;
  return (
    <div className="space-y-8">
      <PortalPageHeader
        eyebrow="Initiative reporting"
        title="Monthly initiative report"
        description={`Director totals for ${month}. Only verified entries appear in public totals.`}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Black Spending</p>
          <p className="mt-2 text-3xl font-bold">
            ${(snapshot.totals.blackSpendingCents / 100).toFixed(2)}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {snapshot.totals.blackSpendingMinutes} minutes recorded
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Daily Steps</p>
          <p className="mt-2 text-3xl font-bold">
            {snapshot.totals.steps.toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {snapshot.totals.stepsMinutes} minutes recorded
          </p>
        </div>
      </div>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Awaiting review</h2>
          {pendingImportedCount > 0 && (
            <form action={approveImportedInitiatives}>
              <button className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">
                Approve {pendingImportedCount} imported {pendingImportedCount === 1 ? "entry" : "entries"}
              </button>
            </form>
          )}
        </div>
        {pending.length === 0 ? <p className="text-sm text-zinc-500">No entries are waiting for review.</p> : pending.map((entry: any) => (
          <article key={entry.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="font-semibold">{entry.first_name} {entry.last_name} · {entry.initiative === "steps" ? `${entry.steps?.toLocaleString() ?? 0} steps` : `$${((entry.amount_cents ?? 0) / 100).toFixed(2)}`}</p>
            <p className="mt-1 text-sm text-zinc-500">Submitted {new Date(entry.created_at).toLocaleString()}</p>
            <div className="mt-4 flex gap-3">
              <form action={reviewInitiative}><input type="hidden" name="submissionId" value={entry.id} /><input type="hidden" name="status" value="approved" /><button className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">Approve</button></form>
              <form action={reviewInitiative}><input type="hidden" name="submissionId" value={entry.id} /><input type="hidden" name="status" value="rejected" /><button className="rounded-full border px-4 py-2 text-sm font-semibold">Reject</button></form>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
