import { requireChapterAdmin } from "@/lib/auth/authorization";
import { getApprovedInitiativeReport } from "@/lib/initiatives/queries";
import {
  initiativeReportCsv,
  initiativeReportKind,
  reportMonth,
} from "@/lib/initiatives/report";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";

export async function GET(request: Request) {
  await requireChapterAdmin();
  const { chapterId } = await getTenantContext();
  const searchParams = new URL(request.url).searchParams;
  const month = reportMonth(searchParams.get("month") ?? undefined);
  const initiative = initiativeReportKind(searchParams.get("initiative"));
  if (!initiative) return new Response("Unknown initiative report.", { status: 400 });
  const report = await getApprovedInitiativeReport(chapterId, month);
  const csv = initiativeReportCsv({
    month,
    initiative,
    totals: report.totals,
    entries: report.entries.filter((entry) => entry.initiative === initiative),
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="birmingham-sigmas-${initiative.replace("_", "-")}-report-${month}.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
