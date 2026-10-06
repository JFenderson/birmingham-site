import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { type TestContext } from "node:test";

import { isSafeExternalUrl } from "../src/lib/content-links.ts";
import { sigmaBetaInterestSchema } from "../src/lib/validation/schemas.ts";
import * as actions from "../src/app/(public)/sigma-beta-club/actions.ts";
import {
  NEUTRAL_SIGMA_BETA_INTEREST_RESULT,
  sigmaBetaInterestActionDependencies,
} from "../src/lib/sigma-beta/interest-action-support.ts";

const validInput = {
  parentName: "Jordan Miles",
  parentEmail: "jordan.miles@example.com",
  parentPhone: "(205) 555-0100",
  studentName: "Alex Miles",
  studentAge: 13,
  gradeLevel: "8" as const,
  studentSchool: "Example Middle School",
  referralSource: "school" as const,
  message: "Please send information about the next meeting.",
  website: "",
};

test("public form action modules export only server functions", () => {
  for (const path of [
    "src/app/(public)/sigma-beta-club/actions.ts",
    "src/app/(public)/foundation/actions.ts",
  ]) {
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, /^export\s+(?:const|let|var)\s/m, path);
  }
});

test("guardian phone pattern is valid under HTML's v regex flag", () => {
  const source = readFileSync("src/components/public/sigma-beta-interest-form.tsx", "utf8");
  const pattern = source.match(/name="parentPhone"[^>]*pattern="([^"]+)"/)?.[1];
  assert.ok(pattern);
  const phone = new RegExp(`^(?:${pattern})$`, "v");
  assert.equal(phone.test("(205) 555-0100"), true);
  assert.equal(phone.test("123"), false);
});

function mockDependencies(context: TestContext) {
  const stored: unknown[] = [];
  const notified: unknown[] = [];
  context.mock.method(sigmaBetaInterestActionDependencies, "headers", async () => new Headers({ "x-forwarded-for": "203.0.113.20" }));
  context.mock.method(sigmaBetaInterestActionDependencies, "checkRateLimit", async () => ({ success: true }));
  context.mock.method(sigmaBetaInterestActionDependencies, "getCurrentChapter", async () => ({ chapterId: "11111111-1111-4111-8111-111111111111", name: "Tau Sigma", chapterSlug: "root" }) as never);
  context.mock.method(sigmaBetaInterestActionDependencies, "storeSigmaBetaInterest", async (...args: unknown[]) => { stored.push(args); });
  context.mock.method(sigmaBetaInterestActionDependencies, "sendSigmaBetaInterestNotification", async (payload: unknown) => { notified.push(payload); return { submitterError: null, adminError: null }; });
  return { stored, notified };
}

test("Sigma Beta interest requires guardian and student details", () => {
  assert.equal(sigmaBetaInterestSchema.safeParse(validInput).success, true);
  for (const key of ["parentName", "parentEmail", "parentPhone", "studentName", "studentAge", "gradeLevel", "studentSchool"] as const) {
    const input = { ...validInput, [key]: "" };
    assert.equal(sigmaBetaInterestSchema.safeParse(input).success, false, key);
  }
  assert.equal(sigmaBetaInterestSchema.safeParse({ ...validInput, parentEmail: "invalid" }).success, false);
  assert.equal(sigmaBetaInterestSchema.safeParse({ ...validInput, parentPhone: "123" }).success, false);
  assert.equal(sigmaBetaInterestSchema.safeParse({ ...validInput, gradeLevel: "1" }).success, false);
  assert.equal(sigmaBetaInterestSchema.safeParse({ ...validInput, studentAge: 7 }).success, false);
  assert.equal(sigmaBetaInterestSchema.safeParse({ ...validInput, studentAge: 8, gradeLevel: "3" }).success, true);
  assert.equal(sigmaBetaInterestSchema.safeParse({ ...validInput, website: "spam" }).success, false);
  assert.equal(sigmaBetaInterestSchema.safeParse({ ...validInput, referralSource: "", message: "" }).success, true);
});

test("valid interest is stored and notifications address the parent", async (context) => {
  const { stored, notified } = mockDependencies(context);
  const result = await actions.submitSigmaBetaInterest(validInput);
  assert.deepEqual(result, NEUTRAL_SIGMA_BETA_INTEREST_RESULT);
  assert.equal(stored.length, 1);
  assert.equal(notified.length, 1);
  assert.equal((notified[0] as { to: string }).to, validInput.parentEmail);
  assert.equal((notified[0] as { studentName: string }).studentName, validInput.studentName);
});

test("storage failure reports an error and skips notifications", async (context) => {
  const { notified } = mockDependencies(context);
  context.mock.method(sigmaBetaInterestActionDependencies, "storeSigmaBetaInterest", async () => { throw new Error("DB unavailable"); });
  const result = await actions.submitSigmaBetaInterest(validInput);
  assert.equal(result.success, false);
  assert.equal(notified.length, 0);
});

test("notification failure does not lose a stored interest", async (context) => {
  const { stored } = mockDependencies(context);
  context.mock.method(sigmaBetaInterestActionDependencies, "sendSigmaBetaInterestNotification", async () => ({ submitterError: new Error("Mail unavailable"), adminError: new Error("Mail unavailable") }));
  const result = await actions.submitSigmaBetaInterest(validInput);
  assert.deepEqual(result, NEUTRAL_SIGMA_BETA_INTEREST_RESULT);
  assert.equal(stored.length, 1);
});

test("validation and honeypot do not write records", async (context) => {
  const { stored, notified } = mockDependencies(context);
  const invalid = await actions.submitSigmaBetaInterest({ ...validInput, parentEmail: "invalid" });
  assert.equal(invalid.success, false);
  const bot = await actions.submitSigmaBetaInterest({ ...validInput, website: "spam" });
  assert.deepEqual(bot, NEUTRAL_SIGMA_BETA_INTEREST_RESULT);
  assert.equal(stored.length, 0);
  assert.equal(notified.length, 0);
});

test("rate limiting reports an error before storage", async (context) => {
  const { stored } = mockDependencies(context);
  context.mock.method(sigmaBetaInterestActionDependencies, "checkRateLimit", async () => ({ success: false }));
  const result = await actions.submitSigmaBetaInterest(validInput);
  assert.equal(result.success, false);
  assert.equal(stored.length, 0);
});

test("safe event links still use internal paths or HTTPS", () => {
  assert.equal(isSafeExternalUrl("/events/register"), true);
  assert.equal(isSafeExternalUrl("https://forms.example.com/register"), true);
  assert.equal(isSafeExternalUrl("javascript:alert(1)"), false);
});
