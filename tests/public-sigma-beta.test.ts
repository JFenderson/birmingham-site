import assert from "node:assert/strict";
import test from "node:test";

import { isSafeExternalUrl } from "../src/lib/content-links.ts";
import { sigmaBetaInterestSchema } from "../src/lib/validation/schemas.ts";
import * as sigmaBetaActions from "../src/app/(public)/sigma-beta-club/actions.ts";

const validInput = {
  name: "Jordan Miles",
  email: "jordan.miles@example.com",
  phone: "",
  role: "student" as const,
  message: "Interested in joining the club.",
  website: "",
};

function createHeaders(ip = "203.0.113.20") {
  return new Headers({ "x-forwarded-for": `${ip}, 10.0.0.1` });
}

test("sigmaBetaInterestSchema accepts valid input with blank optional fields", () => {
  const parsed = sigmaBetaInterestSchema.safeParse(validInput);
  assert.equal(parsed.success, true);
});

test("sigmaBetaInterestSchema rejects a blank name", () => {
  assert.equal(
    sigmaBetaInterestSchema.safeParse({ ...validInput, name: "" }).success,
    false,
  );
});

test("sigmaBetaInterestSchema rejects an invalid email", () => {
  assert.equal(
    sigmaBetaInterestSchema.safeParse({ ...validInput, email: "not-an-email" })
      .success,
    false,
  );
});

test("sigmaBetaInterestSchema accepts optional phone and message when provided", () => {
  const parsed = sigmaBetaInterestSchema.safeParse({
    ...validInput,
    phone: "205-555-0100",
    message: "Hello there, my student would like to join.",
  });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.phone, "205-555-0100");
  }
});

test("sigmaBetaInterestSchema rejects an unknown role", () => {
  assert.equal(
    sigmaBetaInterestSchema.safeParse({ ...validInput, role: "teacher" }).success,
    false,
  );
});

test("sigmaBetaInterestSchema rejects a non-empty honeypot value", () => {
  assert.equal(
    sigmaBetaInterestSchema.safeParse({
      ...validInput,
      website: "http://spam.example",
    }).success,
    false,
  );
});

test("submitSigmaBetaInterest returns an error result when rate limited", async (context) => {
  context.mock.method(
    sigmaBetaActions.sigmaBetaInterestActionDependencies,
    "headers",
    async () => createHeaders(),
  );
  context.mock.method(
    sigmaBetaActions.sigmaBetaInterestActionDependencies,
    "checkRateLimit",
    async () => ({ success: false }),
  );

  const result = await sigmaBetaActions.submitSigmaBetaInterest(validInput);

  assert.deepEqual(result, {
    success: false,
    error: "Too many submissions. Please try again later.",
  });
});

test("submitSigmaBetaInterest returns a validation error for invalid input without notifying", async (context) => {
  const notifyCalls: unknown[] = [];

  context.mock.method(
    sigmaBetaActions.sigmaBetaInterestActionDependencies,
    "headers",
    async () => createHeaders(),
  );
  context.mock.method(
    sigmaBetaActions.sigmaBetaInterestActionDependencies,
    "checkRateLimit",
    async () => ({ success: true }),
  );
  context.mock.method(
    sigmaBetaActions.sigmaBetaInterestActionDependencies,
    "getCurrentChapter",
    async () => ({ name: "Tau Sigma", chapterSlug: "root" }) as never,
  );
  context.mock.method(
    sigmaBetaActions.sigmaBetaInterestActionDependencies,
    "sendSigmaBetaInterestNotification",
    async (payload: Record<string, unknown>) => {
      notifyCalls.push(payload);
      return { submitterError: null, adminError: null };
    },
  );

  const result = await sigmaBetaActions.submitSigmaBetaInterest({
    ...validInput,
    email: "not-an-email",
  });

  assert.equal(result.success, false);
  assert.equal(notifyCalls.length, 0);
});

test("submitSigmaBetaInterest returns neutral success without notifying when the honeypot is filled", async (context) => {
  const notifyCalls: unknown[] = [];

  context.mock.method(
    sigmaBetaActions.sigmaBetaInterestActionDependencies,
    "headers",
    async () => createHeaders(),
  );
  context.mock.method(
    sigmaBetaActions.sigmaBetaInterestActionDependencies,
    "checkRateLimit",
    async () => ({ success: true }),
  );
  context.mock.method(
    sigmaBetaActions.sigmaBetaInterestActionDependencies,
    "getCurrentChapter",
    async () => ({ name: "Tau Sigma", chapterSlug: "root" }) as never,
  );
  context.mock.method(
    sigmaBetaActions.sigmaBetaInterestActionDependencies,
    "sendSigmaBetaInterestNotification",
    async (payload: Record<string, unknown>) => {
      notifyCalls.push(payload);
      return { submitterError: null, adminError: null };
    },
  );

  const result = await sigmaBetaActions.submitSigmaBetaInterest({
    ...validInput,
    website: "http://spam.example",
  });

  assert.deepEqual(result, sigmaBetaActions.NEUTRAL_SIGMA_BETA_INTEREST_RESULT);
  assert.equal(notifyCalls.length, 0);
});

test("submitSigmaBetaInterest sends a notification and returns neutral success for valid input", async (context) => {
  const notifyCalls: Array<Record<string, unknown>> = [];

  context.mock.method(
    sigmaBetaActions.sigmaBetaInterestActionDependencies,
    "headers",
    async () => createHeaders(),
  );
  context.mock.method(
    sigmaBetaActions.sigmaBetaInterestActionDependencies,
    "checkRateLimit",
    async () => ({ success: true }),
  );
  context.mock.method(
    sigmaBetaActions.sigmaBetaInterestActionDependencies,
    "getCurrentChapter",
    async () => ({ name: "Tau Sigma", chapterSlug: "root" }) as never,
  );
  context.mock.method(
    sigmaBetaActions.sigmaBetaInterestActionDependencies,
    "sendSigmaBetaInterestNotification",
    async (payload: Record<string, unknown>) => {
      notifyCalls.push(payload);
      return { submitterError: null, adminError: null };
    },
  );

  const result = await sigmaBetaActions.submitSigmaBetaInterest(validInput);

  assert.deepEqual(result, sigmaBetaActions.NEUTRAL_SIGMA_BETA_INTEREST_RESULT);
  assert.equal(notifyCalls.length, 1);
  assert.equal(notifyCalls[0]?.to, validInput.email);
  assert.equal(notifyCalls[0]?.submitterName, validInput.name);
  assert.equal(notifyCalls[0]?.chapterName, "Tau Sigma");
  assert.equal(notifyCalls[0]?.roleLabel, "Student");
});

test("isSafeExternalUrl accepts internal paths and https URLs", () => {
  assert.equal(isSafeExternalUrl("/events/register"), true);
  assert.equal(isSafeExternalUrl("https://forms.example.com/register"), true);
});

test("isSafeExternalUrl rejects unsafe schemes, protocol-relative, and empty values", () => {
  assert.equal(isSafeExternalUrl(""), false);
  assert.equal(isSafeExternalUrl("http://example.com"), false);
  assert.equal(isSafeExternalUrl("javascript:alert(1)"), false);
  assert.equal(isSafeExternalUrl("//evil.example/phish"), false);
});
