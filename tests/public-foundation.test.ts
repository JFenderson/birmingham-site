import assert from "node:assert/strict";
import test from "node:test";

import { isSafeExternalUrl } from "../src/lib/content-links.ts";
import { foundationInformationRequestSchema } from "../src/lib/validation/schemas.ts";
import { getSafeDonationHref } from "../src/lib/foundation-donation.ts";
import * as foundationActions from "../src/app/(public)/foundation/actions.ts";

const validInput = {
  name: "Jordan Miles",
  email: "jordan.miles@example.com",
  organization: "",
  phone: "",
  message: "Please send information about corporate sponsorship opportunities.",
  website: "",
};

function createHeaders(ip = "203.0.113.20") {
  return new Headers({ "x-forwarded-for": `${ip}, 10.0.0.1` });
}

test("foundationInformationRequestSchema accepts valid input with blank optional fields", () => {
  const parsed = foundationInformationRequestSchema.safeParse(validInput);
  assert.equal(parsed.success, true);
});

test("foundationInformationRequestSchema rejects a blank name", () => {
  assert.equal(
    foundationInformationRequestSchema.safeParse({ ...validInput, name: "" }).success,
    false,
  );
});

test("foundationInformationRequestSchema rejects an invalid email", () => {
  assert.equal(
    foundationInformationRequestSchema.safeParse({ ...validInput, email: "not-an-email" })
      .success,
    false,
  );
});

test("foundationInformationRequestSchema requires a non-blank message", () => {
  assert.equal(
    foundationInformationRequestSchema.safeParse({ ...validInput, message: "" }).success,
    false,
  );
});

test("foundationInformationRequestSchema accepts optional organization and phone when provided", () => {
  const parsed = foundationInformationRequestSchema.safeParse({
    ...validInput,
    organization: "Acme Corp",
    phone: "205-555-0100",
  });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.organization, "Acme Corp");
    assert.equal(parsed.data.phone, "205-555-0100");
  }
});

test("foundationInformationRequestSchema rejects a non-empty honeypot value", () => {
  assert.equal(
    foundationInformationRequestSchema.safeParse({
      ...validInput,
      website: "http://spam.example",
    }).success,
    false,
  );
});

test("submitFoundationInformationRequest returns an error result when rate limited", async (context) => {
  context.mock.method(
    foundationActions.foundationInformationRequestActionDependencies,
    "headers",
    async () => createHeaders(),
  );
  context.mock.method(
    foundationActions.foundationInformationRequestActionDependencies,
    "checkRateLimit",
    async () => ({ success: false }),
  );

  const result = await foundationActions.submitFoundationInformationRequest(validInput);

  assert.deepEqual(result, {
    success: false,
    error: "Too many submissions. Please try again later.",
  });
});

test("submitFoundationInformationRequest returns a validation error for invalid input without notifying", async (context) => {
  const notifyCalls: unknown[] = [];

  context.mock.method(
    foundationActions.foundationInformationRequestActionDependencies,
    "headers",
    async () => createHeaders(),
  );
  context.mock.method(
    foundationActions.foundationInformationRequestActionDependencies,
    "checkRateLimit",
    async () => ({ success: true }),
  );
  context.mock.method(
    foundationActions.foundationInformationRequestActionDependencies,
    "getCurrentChapter",
    async () => ({ name: "Tau Sigma", chapterSlug: "root" }) as never,
  );
  context.mock.method(
    foundationActions.foundationInformationRequestActionDependencies,
    "sendFoundationInformationRequestNotification",
    async (payload: Record<string, unknown>) => {
      notifyCalls.push(payload);
      return { submitterError: null, adminError: null };
    },
  );

  const result = await foundationActions.submitFoundationInformationRequest({
    ...validInput,
    email: "not-an-email",
  });

  assert.equal(result.success, false);
  assert.equal(notifyCalls.length, 0);
});

test("submitFoundationInformationRequest returns neutral success without notifying when the honeypot is filled", async (context) => {
  const notifyCalls: unknown[] = [];

  context.mock.method(
    foundationActions.foundationInformationRequestActionDependencies,
    "headers",
    async () => createHeaders(),
  );
  context.mock.method(
    foundationActions.foundationInformationRequestActionDependencies,
    "checkRateLimit",
    async () => ({ success: true }),
  );
  context.mock.method(
    foundationActions.foundationInformationRequestActionDependencies,
    "getCurrentChapter",
    async () => ({ name: "Tau Sigma", chapterSlug: "root" }) as never,
  );
  context.mock.method(
    foundationActions.foundationInformationRequestActionDependencies,
    "sendFoundationInformationRequestNotification",
    async (payload: Record<string, unknown>) => {
      notifyCalls.push(payload);
      return { submitterError: null, adminError: null };
    },
  );

  const result = await foundationActions.submitFoundationInformationRequest({
    ...validInput,
    website: "http://spam.example",
  });

  assert.deepEqual(result, foundationActions.NEUTRAL_FOUNDATION_INFORMATION_REQUEST_RESULT);
  assert.equal(notifyCalls.length, 0);
});

test("submitFoundationInformationRequest sends a notification and returns neutral success for valid input", async (context) => {
  const notifyCalls: Array<Record<string, unknown>> = [];

  context.mock.method(
    foundationActions.foundationInformationRequestActionDependencies,
    "headers",
    async () => createHeaders(),
  );
  context.mock.method(
    foundationActions.foundationInformationRequestActionDependencies,
    "checkRateLimit",
    async () => ({ success: true }),
  );
  context.mock.method(
    foundationActions.foundationInformationRequestActionDependencies,
    "getCurrentChapter",
    async () => ({ name: "Tau Sigma Charity Foundation", chapterSlug: "root" }) as never,
  );
  context.mock.method(
    foundationActions.foundationInformationRequestActionDependencies,
    "sendFoundationInformationRequestNotification",
    async (payload: Record<string, unknown>) => {
      notifyCalls.push(payload);
      return { submitterError: null, adminError: null };
    },
  );

  const result = await foundationActions.submitFoundationInformationRequest(validInput);

  assert.deepEqual(result, foundationActions.NEUTRAL_FOUNDATION_INFORMATION_REQUEST_RESULT);
  assert.equal(notifyCalls.length, 1);
  assert.equal(notifyCalls[0]?.to, validInput.email);
  assert.equal(notifyCalls[0]?.submitterName, validInput.name);
  assert.equal(notifyCalls[0]?.nonprofitName, "Tau Sigma Charity Foundation");
  assert.equal(notifyCalls[0]?.message, validInput.message);
});

test("isSafeExternalUrl accepts internal paths and https URLs (reused from Task 3)", () => {
  assert.equal(isSafeExternalUrl("/events/register"), true);
  assert.equal(isSafeExternalUrl("https://forms.example.com/register"), true);
});

test("getSafeDonationHref returns the trimmed URL for safe https/internal values", () => {
  assert.equal(getSafeDonationHref("https://square.link/u/abc123"), "https://square.link/u/abc123");
  assert.equal(getSafeDonationHref("  https://square.link/u/abc123  "), "https://square.link/u/abc123");
  assert.equal(getSafeDonationHref("/give"), "/give");
});

test("getSafeDonationHref returns null for unsafe, blank, or missing values", () => {
  assert.equal(getSafeDonationHref(""), null);
  assert.equal(getSafeDonationHref(null), null);
  assert.equal(getSafeDonationHref(undefined), null);
  assert.equal(getSafeDonationHref("http://insecure.example"), null);
  assert.equal(getSafeDonationHref("javascript:alert(1)"), null);
  assert.equal(getSafeDonationHref("//evil.example/phish"), null);
});
