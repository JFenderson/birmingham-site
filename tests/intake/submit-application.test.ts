import assert from "node:assert/strict";
import test from "node:test";

import {
  getInterestFormTypeLabel,
  intakeFormSchema,
} from "../../src/lib/validation/schemas.ts";

const commonFields = {
  fullName: "Jordan Miles",
  email: "jmiles@example.com",
  phone: "205-555-0100",
  message: "Looking forward to learning more.",
};

test("intake form schema accepts membership interest submissions", () => {
  assert.equal(
    intakeFormSchema.safeParse({
      ...commonFields,
      formType: "membership_interest",
      schoolName: "UAB",
      major: "Engineering",
      expectedGraduationYear: "2028",
    }).success,
    true,
  );
});

test("intake form schema accepts transfer submissions", () => {
  assert.equal(
    intakeFormSchema.safeParse({
      ...commonFields,
      formType: "transfer",
      previousChapterName: "Beta Sigma",
    }).success,
    true,
  );
});

test("intake form schema accepts reactivation submissions", () => {
  assert.equal(
    intakeFormSchema.safeParse({
      ...commonFields,
      formType: "reactivation",
      previousChapterName: "Tau Sigma",
      yearsInactive: "4",
    }).success,
    true,
  );
});

test("intake form schema rejects the retired intake form type", () => {
  assert.equal(
    intakeFormSchema.safeParse({
      ...commonFields,
      formType: "intake",
      schoolName: "UAB",
    }).success,
    false,
  );
});

test("interest form labels expose a human-readable membership interest label", () => {
  assert.equal(
    getInterestFormTypeLabel("membership_interest"),
    "Membership Interest",
  );
});
