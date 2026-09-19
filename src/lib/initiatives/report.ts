const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

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
  totals: {
    blackSpendingCents: number;
    blackSpendingMinutes: number;
    steps: number;
    stepsMinutes: number;
  };
  entries: InitiativeReportRow[];
}): string {
  const rows = [
    csvLine(["Birmingham Sigmas initiative report"]),
    csvLine(["Reporting month", input.month]),
    csvLine(["Verified Black Spending", `$${(input.totals.blackSpendingCents / 100).toFixed(2)}`]),
    csvLine(["Verified Steps", input.totals.steps]),
    csvLine(["Black Spending time (minutes)", input.totals.blackSpendingMinutes]),
    csvLine(["Steps time (minutes)", input.totals.stepsMinutes]),
    "",
    csvLine(["Initiative", "Participant", "Activity date", "Steps", "Miles", "Amount", "Minutes", "Business", "Steps source", "Approved at"]),
    ...input.entries.map((entry) => csvLine([
      entry.initiative === "steps" ? "Steps" : "Black Spending",
      `${entry.firstName} ${entry.lastName}`,
      entry.initiative === "steps" ? entry.trackedOn : entry.spentOn,
      entry.steps,
      entry.distanceMiles,
      entry.amountCents === null ? null : `$${(entry.amountCents / 100).toFixed(2)}`,
      entry.durationMinutes,
      entry.businessName,
      entry.stepsSource,
      entry.reviewedAt,
    ])),
  ];

  return `\uFEFF${rows.join("\r\n")}\r\n`;
}
