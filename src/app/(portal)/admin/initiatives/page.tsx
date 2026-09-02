import { requireChapterAdmin } from "@/lib/auth/authorization";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { getInitiativeSnapshot } from "@/lib/initiatives/queries";
import { PortalPageHeader } from "@/components/portal/portal-page-header";

export default async function InitiativeReportPage() {
  await requireChapterAdmin();
  const { chapterId } = await getTenantContext();
  const month = new Date().toISOString().slice(0, 7);
  const snapshot = await getInitiativeSnapshot(chapterId, month);
  return (
    <div className="space-y-8">
      <PortalPageHeader
        eyebrow="Initiative reporting"
        title="Monthly initiative report"
        description={`Director totals for ${month}. Entries are automatically approved.`}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Black Spending</p>
          <p className="mt-2 text-3xl font-bold">
            ${(snapshot.totals.blackSpendingCents / 100).toFixed(2)}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {snapshot.totals.blackSpendingMinutes} minutes
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Daily Steps</p>
          <p className="mt-2 text-3xl font-bold">
            {snapshot.totals.steps.toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {snapshot.totals.stepsMinutes} minutes
          </p>
        </div>
      </div>
    </div>
  );
}
