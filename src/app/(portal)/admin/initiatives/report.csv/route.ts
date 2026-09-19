import { requireChapterAdmin } from "@/lib/auth/authorization";
import { getApprovedInitiativeReport } from "@/lib/initiatives/queries";
import { initiativeReportCsv, reportMonth } from "@/lib/initiatives/report";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";

export async function GET(request: Request) {
  await requireChapterAdmin();
  const { chapterId } = await getTenantContext();
  const month = reportMonth(new URL(request.url).searchParams.get("month") ?? undefined);
  const report = await getApprovedInitiativeReport(chapterId, month);
  const csv = initiativeReportCsv({ month, totals: report.totals, entries: report.entries });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="birmingham-sigmas-initiative-report-${month}.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
