import assert from "node:assert/strict";
import test from "node:test";
import { estimateStepsFromMiles, formatPublicName, initiativeSubmissionSchema, monthlyTotals, rankInitiativePeople } from "../../src/lib/initiatives/tracker";

test("formats public ranking names as first initial plus last name", () => {
  assert.equal(formatPublicName("Jordan", "Smith"), "J. Smith");
});

test("validates both initiative payload shapes", () => {
  assert.equal(initiativeSubmissionSchema.parse({ initiative: "black_spending", firstName: "Jordan", lastName: "Smith", businessName: "BHM Books", amountCents: 2500, spentOn: "2026-09-01", evidencePath: "x" }).initiative, "black_spending");
  const parsed = initiativeSubmissionSchema.parse({ initiative: "steps", firstName: "Jordan", lastName: "Smith", steps: 8000, trackedOn: "2026-09-01", durationHours: 1, durationMinutes: 30, distanceMiles: 2.5, evidencePath: "x" });
  assert.equal(parsed.initiative === "steps" ? parsed.steps : 0, 8000);
  assert.equal(parsed.initiative === "steps" ? parsed.distanceMiles : 0, 2.5);
});

test("allows a steps submission without a duration", () => {
  const parsed = initiativeSubmissionSchema.parse({ initiative: "steps", firstName: "Jordan", lastName: "Smith", steps: 8000, trackedOn: "2026-09-01", evidencePath: "x" });
  assert.equal(parsed.initiative === "steps" ? parsed.durationHours : 1, undefined);
  assert.equal(parsed.initiative === "steps" ? parsed.durationMinutes : 1, undefined);
});

test("allows a steps submission with miles instead of steps", () => {
  const parsed = initiativeSubmissionSchema.parse({ initiative: "steps", firstName: "Jordan", lastName: "Smith", trackedOn: "2026-09-01", distanceMiles: 2.4, evidencePath: "x" });
  assert.equal(parsed.initiative, "steps");
});

test("calculates initiative monthly totals from approved submissions", () => {
  assert.deepEqual(monthlyTotals([
    { initiative: "black_spending", amountCents: 1250, durationMinutes: null, steps: null },
    { initiative: "steps", amountCents: null, durationMinutes: 90, steps: 8000 },
  ]), { blackSpendingCents: 1250, blackSpendingMinutes: 0, steps: 8000, stepsMinutes: 90 });
});

test("estimates steps from miles using a configurable rate", () => {
  assert.equal(estimateStepsFromMiles(4.51, 2100), 9471);
  assert.equal(estimateStepsFromMiles(0, 2100), 0);
});

test("combines steps for each brother before ranking", () => {
  assert.deepEqual(rankInitiativePeople([
    { firstName: "Doug", lastName: "Crowder", score: 5000 },
    { firstName: "doug", lastName: "CROWDER", score: 7000 },
    { firstName: "Jordan", lastName: "Smith", score: 11000 },
  ]), [
    { name: "D. Crowder", score: 12000 },
    { name: "J. Smith", score: 11000 },
  ]);
});
