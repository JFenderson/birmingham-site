const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export type InitiativeReportKind = "black_spending" | "steps";

export type InitiativeReportRow = {
  initiative: string;
  firstName: string;
  lastName: string;
  businessName: string | null;
  amountCents: number | null;
  spentOn: string | null;
  steps: number | null;
  distanceMiles: number | null;
  trackedOn: string | null;
  durationMinutes: number | null;
  stepsSource: string | null;
  reviewedAt: string | null;
};

export function reportMonth(value: string | undefined): string {
  if (value && MONTH_PATTERN.test(value)) return value;
  return new Date().toISOString().slice(0, 7);
}

export function initiativeReportKind(value: string | null): InitiativeReportKind | null {
  return value === "black_spending" || value === "steps" ? value : null;
}

function csvCell(value: string | number | null | undefined): string {
  const text = String(value ?? "");
  const safeText = /^[=+\-@]/.test(text.trimStart()) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

function csvLine(values: Array<string | number | null | undefined>): string {
  return values.map(csvCell).join(",");
}

export function initiativeReportCsv(input: {
  month: string;
  initiative: InitiativeReportKind;
  totals: {
    blackSpendingCents: number;
    blackSpendingMinutes: number;
    steps: number;
    stepsMinutes: number;
  };
  entries: InitiativeReportRow[];
}): string {
  const isSteps = input.initiative === "steps";
  const rows = [
    csvLine([`Birmingham Sigmas ${isSteps ? "Steps" : "Black Spending"} report`]),
    csvLine(["Reporting month", input.month]),
    csvLine(isSteps
      ? ["Verified Steps", input.totals.steps]
      : ["Verified Black Spending", `$${(input.totals.blackSpendingCents / 100).toFixed(2)}`]),
    csvLine(isSteps
      ? ["Steps time (minutes)", input.totals.stepsMinutes]
      : ["Black Spending time (minutes)", input.totals.blackSpendingMinutes]),
    "",
    csvLine(isSteps
      ? ["Participant", "Activity date", "Steps", "Miles", "Minutes", "Steps source", "Approved at"]
      : ["Participant", "Activity date", "Amount", "Minutes", "Business", "Approved at"]),
    ...input.entries.map((entry) => csvLine([
      `${entry.firstName} ${entry.lastName}`,
      isSteps ? entry.trackedOn : entry.spentOn,
      ...(isSteps
        ? [entry.steps, entry.distanceMiles, entry.durationMinutes, entry.stepsSource, entry.reviewedAt]
        : [entry.amountCents === null ? null : `$${(entry.amountCents / 100).toFixed(2)}`, entry.durationMinutes, entry.businessName, entry.reviewedAt]),
    ])),
  ];

  return `\uFEFF${rows.join("\r\n")}\r\n`;
}
