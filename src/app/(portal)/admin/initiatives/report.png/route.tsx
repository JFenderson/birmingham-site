import { ImageResponse } from "next/og";
import { requireChapterAdmin } from "@/lib/auth/authorization";
import { getApprovedInitiativeReport } from "@/lib/initiatives/queries";
import {
  initiativeReportKind,
  reportMonth,
  type InitiativeReportKind,
  type InitiativeReportRow,
} from "@/lib/initiatives/report";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";

const WIDTH = 1200;
const HEIGHT = 1800;
const MAX_VISIBLE_ENTRIES = 18;

function entryDetail(entry: InitiativeReportRow, initiative: InitiativeReportKind): string {
  if (initiative === "steps") {
    const miles = entry.distanceMiles === null ? "" : ` · ${entry.distanceMiles} mi`;
    return `${entry.steps?.toLocaleString() ?? 0} steps${miles}`;
  }
  const business = entry.businessName ? ` · ${entry.businessName}` : "";
  return `$${((entry.amountCents ?? 0) / 100).toFixed(2)}${business}`;
}

export async function GET(request: Request) {
  await requireChapterAdmin();
  const { chapterId } = await getTenantContext();
  const searchParams = new URL(request.url).searchParams;
  const month = reportMonth(searchParams.get("month") ?? undefined);
  const initiative = initiativeReportKind(searchParams.get("initiative"));
  if (!initiative) return new Response("Unknown initiative report.", { status: 400 });

  const report = await getApprovedInitiativeReport(chapterId, month);
  const entries = report.entries.filter((entry) => entry.initiative === initiative);
  const visibleEntries = entries.slice(0, MAX_VISIBLE_ENTRIES);
  const isSteps = initiative === "steps";
  const title = isSteps ? "Steps Activity Report" : "Black Spending Report";
  const total = isSteps
    ? report.totals.steps.toLocaleString()
    : `$${(report.totals.blackSpendingCents / 100).toFixed(2)}`;
  const time = isSteps ? report.totals.stepsMinutes : report.totals.blackSpendingMinutes;

  return new ImageResponse(
    (
      <div style={{ background: "#f4f7fb", color: "#0b1930", display: "flex", flexDirection: "column", height: "100%", padding: "72px" }}>
        <div style={{ alignItems: "center", color: "#0047ab", display: "flex", fontSize: 28, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" }}>
          Birmingham Sigmas · Tau Sigma Chapter
        </div>
        <div style={{ background: "#0047ab", height: 12, marginTop: 30, width: 180 }} />
        <div style={{ display: "flex", flexDirection: "column", marginTop: 38 }}>
          <div style={{ fontSize: 66, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
          <div style={{ color: "#526175", fontSize: 32, marginTop: 18 }}>Verified chapter activity · {month}</div>
        </div>
        <div style={{ display: "flex", gap: 28, marginTop: 48 }}>
          <div style={{ background: "#ffffff", borderRadius: 24, display: "flex", flexDirection: "column", flexGrow: 1, padding: 32 }}>
            <div style={{ color: "#526175", fontSize: 26 }}>{isSteps ? "Verified steps" : "Verified spending"}</div>
            <div style={{ color: "#0047ab", fontSize: 62, fontWeight: 700, marginTop: 12 }}>{total}</div>
          </div>
          <div style={{ background: "#ffffff", borderRadius: 24, display: "flex", flexDirection: "column", flexGrow: 1, padding: 32 }}>
            <div style={{ color: "#526175", fontSize: 26 }}>Approved entries</div>
            <div style={{ color: "#0047ab", fontSize: 62, fontWeight: 700, marginTop: 12 }}>{entries.length}</div>
          </div>
          <div style={{ background: "#ffffff", borderRadius: 24, display: "flex", flexDirection: "column", flexGrow: 1, padding: 32 }}>
            <div style={{ color: "#526175", fontSize: 26 }}>Time recorded</div>
            <div style={{ color: "#0047ab", fontSize: 52, fontWeight: 700, marginTop: 18 }}>{time} min</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 48 }}>
          <div style={{ fontSize: 30, fontWeight: 700 }}>Approved activity details</div>
          {visibleEntries.length === 0 ? (
            <div style={{ background: "#ffffff", borderRadius: 20, color: "#526175", display: "flex", fontSize: 32, marginTop: 24, padding: 32 }}>
              No approved entries were recorded for this month.
            </div>
          ) : visibleEntries.map((entry, index) => (
            <div key={`${entry.firstName}-${entry.lastName}-${entry.trackedOn ?? entry.spentOn}-${index}`} style={{ alignItems: "center", background: "#ffffff", borderBottom: "2px solid #dce4ef", display: "flex", justifyContent: "space-between", marginTop: index === 0 ? 24 : 0, minHeight: 66, padding: "16px 24px" }}>
              <div style={{ display: "flex", flexDirection: "column", maxWidth: 520 }}>
                <div style={{ fontSize: 27, fontWeight: 700 }}>{entry.firstName} {entry.lastName}</div>
                <div style={{ color: "#526175", fontSize: 21, marginTop: 4 }}>{entry.trackedOn ?? entry.spentOn}</div>
              </div>
              <div style={{ color: "#0047ab", display: "flex", fontSize: 25, fontWeight: 700, maxWidth: 490, textAlign: "right" }}>{entryDetail(entry, initiative)}</div>
            </div>
          ))}
          {entries.length > MAX_VISIBLE_ENTRIES && (
            <div style={{ color: "#526175", display: "flex", fontSize: 23, marginTop: 16 }}>
              Plus {entries.length - MAX_VISIBLE_ENTRIES} additional verified entries in the CSV ledger.
            </div>
          )}
        </div>
        <div style={{ color: "#526175", display: "flex", fontSize: 22, marginTop: "auto" }}>
          Generated by Birmingham Sigmas · Approved entries only · For program reporting
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        "Content-Disposition": `attachment; filename="birmingham-sigmas-${initiative.replace("_", "-")}-report-${month}.png"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}
