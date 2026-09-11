import { z } from "zod";

const common = {
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(120),
  durationHours: z.preprocess((value) => value === "" || value === undefined ? undefined : value, z.coerce.number().int().min(0).max(24).optional()),
  durationMinutes: z.preprocess((value) => value === "" || value === undefined ? undefined : value, z.coerce.number().int().min(0).max(59).optional()),
  evidencePath: z.string().trim().min(1).max(500),
};

export const initiativeSubmissionSchema = z.discriminatedUnion("initiative", [
  z.object({ initiative: z.literal("black_spending"), ...common, businessName: z.string().trim().min(1).max(200), amountCents: z.coerce.number().int().min(1).max(10_000_000), spentOn: z.string().date(), blackOwnedConfirmed: z.preprocess((value) => value === true || value === "true" || value === undefined, z.literal(true)).default(true) }),
  z.object({ initiative: z.literal("steps"), ...common, steps: z.preprocess((value) => value === "" || value === undefined ? undefined : value, z.coerce.number().int().min(1).max(200_000).optional()), trackedOn: z.string().date(), distanceMiles: z.preprocess((value) => value === "" || value === undefined ? undefined : value, z.coerce.number().min(0).max(500).optional()) }).refine((value) => value.steps !== undefined || value.distanceMiles !== undefined, { message: "Steps or miles are required" }),
]);

export type InitiativeSubmission = z.infer<typeof initiativeSubmissionSchema>;
export type TotalsInput = { initiative: string; amountCents: number | null; durationMinutes: number | null; steps: number | null };

export const DEFAULT_STEPS_PER_MILE = 2100;

export function estimateStepsFromMiles(miles: number, stepsPerMile = DEFAULT_STEPS_PER_MILE) {
  return Math.round(miles * stepsPerMile);
}

export function formatPublicName(firstName: string, lastName: string) {
  return `${firstName.trim().charAt(0).toUpperCase()}. ${lastName.trim()}`;
}

export function rankInitiativePeople(rows: Array<{ firstName: string; lastName: string; score: number }>) {
  const totals = new Map<string, { firstName: string; lastName: string; score: number }>();
  for (const row of rows) {
    const key = `${row.firstName.trim().toLocaleLowerCase()}\u0000${row.lastName.trim().toLocaleLowerCase()}`;
    const current = totals.get(key);
    if (current) current.score += row.score;
    else totals.set(key, { ...row, firstName: row.firstName.trim(), lastName: row.lastName.trim() });
  }
  return [...totals.values()]
    .map((row) => ({ name: formatPublicName(row.firstName, row.lastName), score: row.score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

export function monthlyTotals(rows: TotalsInput[]) {
  return rows.reduce((totals, row) => {
    if (row.initiative === "black_spending") {
      totals.blackSpendingCents += row.amountCents ?? 0;
      totals.blackSpendingMinutes += row.durationMinutes ?? 0;
    }
    if (row.initiative === "steps") {
      totals.steps += row.steps ?? 0;
      totals.stepsMinutes += row.durationMinutes ?? 0;
    }
    return totals;
  }, { blackSpendingCents: 0, blackSpendingMinutes: 0, steps: 0, stepsMinutes: 0 });
}
