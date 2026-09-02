import assert from "node:assert/strict";
import test from "node:test";
import { formatPublicName, initiativeSubmissionSchema, monthlyTotals } from "../../src/lib/initiatives/tracker";

test("formats public ranking names as first initial plus last name", () => {
  assert.equal(formatPublicName("Jordan", "Smith"), "J. Smith");
});

test("validates both initiative payload shapes", () => {
  assert.equal(initiativeSubmissionSchema.parse({ initiative: "black_spending", firstName: "Jordan", lastName: "Smith", businessName: "BHM Books", amountCents: 2500, spentOn: "2026-09-01", durationMinutes: 45, evidencePath: "x" }).initiative, "black_spending");
  const parsed = initiativeSubmissionSchema.parse({ initiative: "steps", firstName: "Jordan", lastName: "Smith", steps: 8000, trackedOn: "2026-09-01", durationMinutes: 60, evidencePath: "x" });
  assert.equal(parsed.initiative === "steps" ? parsed.steps : 0, 8000);
});

test("calculates initiative monthly totals from approved submissions", () => {
  assert.deepEqual(monthlyTotals([
    { initiative: "black_spending", amountCents: 1250, durationMinutes: 30, steps: null },
    { initiative: "steps", amountCents: null, durationMinutes: 60, steps: 8000 },
  ]), { blackSpendingCents: 1250, blackSpendingMinutes: 30, steps: 8000, stepsMinutes: 60 });
});
