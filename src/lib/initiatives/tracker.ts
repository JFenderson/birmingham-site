import { z } from "zod";

const common = {
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(120),
  durationMinutes: z.coerce.number().int().min(1).max(1440),
  evidencePath: z.string().trim().min(1).max(500),
};

export const initiativeSubmissionSchema = z.discriminatedUnion("initiative", [
  z.object({ initiative: z.literal("black_spending"), ...common, businessName: z.string().trim().min(1).max(200), amountCents: z.coerce.number().int().min(1).max(10_000_000), spentOn: z.string().date(), blackOwnedConfirmed: z.preprocess((value) => value === true || value === "true" || value === undefined, z.literal(true)).default(true) }),
  z.object({ initiative: z.literal("steps"), ...common, steps: z.coerce.number().int().min(1).max(200_000), trackedOn: z.string().date(), distanceMiles: z.coerce.number().min(0).max(500).optional() }),
]);

export type InitiativeSubmission = z.infer<typeof initiativeSubmissionSchema>;
export type TotalsInput = { initiative: string; amountCents: number | null; durationMinutes: number; steps: number | null };

export function formatPublicName(firstName: string, lastName: string) {
  return `${firstName.trim().charAt(0).toUpperCase()}. ${lastName.trim()}`;
}

export function monthlyTotals(rows: TotalsInput[]) {
  return rows.reduce((totals, row) => {
    if (row.initiative === "black_spending") {
      totals.blackSpendingCents += row.amountCents ?? 0;
      totals.blackSpendingMinutes += row.durationMinutes;
    }
    if (row.initiative === "steps") {
      totals.steps += row.steps ?? 0;
      totals.stepsMinutes += row.durationMinutes;
    }
    return totals;
  }, { blackSpendingCents: 0, blackSpendingMinutes: 0, steps: 0, stepsMinutes: 0 });
}
