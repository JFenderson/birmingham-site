import { requireChapterAdmin } from "@/lib/auth/authorization";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { getApprovedInitiativeReport } from "@/lib/initiatives/queries";
import {
  type InitiativeReportKind,
  type InitiativeReportRow,
  reportMonth,
} from "@/lib/initiatives/report";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import {
  countLegacyInitiativeImportInMiles,
  listPendingInitiativeSubmissions,
} from "@/lib/initiatives/review";
import {
  approveImportedInitiatives,
  restoreLegacyImportedInitiatives,
  reviewInitiative,
} from "./actions";

function InitiativeReportSection({
  entries,
  initiative,
  month,
}: {
  entries: InitiativeReportRow[];
  initiative: InitiativeReportKind;
  month: string;
}) {
  const isSteps = initiative === "steps";
  const title = isSteps ? "Steps report" : "Black Spending report";
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {entries.length} verified {entries.length === 1 ? "entry" : "entries"} for {month}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white"
            href={`/admin/initiatives/report.png?month=${encodeURIComponent(month)}&initiative=${initiative}`}
          >
            Download PNG report
          </a>
          <a
            className="rounded-full border border-navy px-4 py-2 text-sm font-semibold text-navy"
            href={`/admin/initiatives/report.csv?month=${encodeURIComponent(month)}&initiative=${initiative}`}
          >
            Download CSV ledger
          </a>
        </div>
      </div>
      {entries.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b text-zinc-500">
              {isSteps ? (
                <tr><th className="p-3">Participant</th><th className="p-3">Date</th><th className="p-3">Steps</th><th className="p-3">Miles</th><th className="p-3">Minutes</th></tr>
              ) : (
                <tr><th className="p-3">Participant</th><th className="p-3">Date</th><th className="p-3">Amount</th><th className="p-3">Minutes</th><th className="p-3">Business</th></tr>
              )}
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr className="border-b" key={`${entry.firstName}-${entry.lastName}-${entry.trackedOn ?? entry.spentOn}-${index}`}>
                  <td className="p-3">{entry.firstName} {entry.lastName}</td>
                  <td className="p-3">{entry.trackedOn ?? entry.spentOn}</td>
                  {isSteps ? (
                    <><td className="p-3 font-semibold">{entry.steps?.toLocaleString() ?? 0}</td><td className="p-3">{entry.distanceMiles ?? "—"}</td><td className="p-3">{entry.durationMinutes ?? "—"}</td></>
                  ) : (
                    <><td className="p-3 font-semibold">${((entry.amountCents ?? 0) / 100).toFixed(2)}</td><td className="p-3">{entry.durationMinutes ?? "—"}</td><td className="p-3">{entry.businessName ?? "—"}</td></>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default async function InitiativeReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  await requireChapterAdmin();
  const { chapterId, chapterSlug } = await getTenantContext();
  const requestedMonth = (await searchParams).month;
  const month = reportMonth(typeof requestedMonth === "string" ? requestedMonth : undefined);
  const [report, pending, legacyImportCount] = await Promise.all([
    getApprovedInitiativeReport(chapterId, month),
    listPendingInitiativeSubmissions(chapterId),
    chapterSlug === "root" ? countLegacyInitiativeImportInMiles() : Promise.resolve(0),
  ]);
  const pendingImportedCount = pending.filter(
    (entry) => entry.submission_source === "group_chat_import"
  ).length;
  const blackSpendingEntries = report.entries.filter(
    (entry) => entry.initiative === "black_spending"
  );
  const stepsEntries = report.entries.filter((entry) => entry.initiative === "steps");
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
            ${(report.totals.blackSpendingCents / 100).toFixed(2)}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {report.totals.blackSpendingMinutes} minutes recorded
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Daily Steps</p>
          <p className="mt-2 text-3xl font-bold">
            {report.totals.steps.toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {report.totals.stepsMinutes} minutes recorded
          </p>
        </div>
      </div>
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <form className="flex flex-wrap items-end gap-3">
            <label className="grid gap-2 text-sm font-semibold">
              Reporting month
              <input className="rounded-lg border border-zinc-300 px-3 py-2" defaultValue={month} name="month" type="month" />
            </label>
            <button className="rounded-full border border-navy px-4 py-2 text-sm font-semibold text-navy">
              View report
            </button>
        </form>
        <p className="mt-4 text-sm text-zinc-600">
          Select a month to prepare separate verified reports for each program director.
        </p>
      </section>
      <InitiativeReportSection entries={blackSpendingEntries} initiative="black_spending" month={month} />
      <InitiativeReportSection entries={stepsEntries} initiative="steps" month={month} />
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Awaiting review</h2>
          {legacyImportCount > 0 ? (
            <form action={restoreLegacyImportedInitiatives}>
              <button className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">
                Restore {legacyImportCount} imported {legacyImportCount === 1 ? "entry" : "entries"}
              </button>
            </form>
          ) : pendingImportedCount > 0 && (
            <form action={approveImportedInitiatives}>
              <button className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">
                Approve {pendingImportedCount} imported {pendingImportedCount === 1 ? "entry" : "entries"}
              </button>
            </form>
          )}
        </div>
        {pending.length === 0 ? <p className="text-sm text-zinc-500">No entries are waiting for review.</p> : pending.map((entry) => (
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
