import assert from "node:assert/strict";
import test from "node:test";
import { initiativeSubmissionSchema } from "../../src/lib/initiatives/tracker";
import { scholarshipApplicationSchema } from "../../src/lib/scholarship/application";
import { isSafeContentActionHref, isSafeExternalUrl, sanitizeContentAction } from "../../src/lib/content-links";
import { resolveSafeLoginRedirect } from "../../src/lib/security/redirects";
import { checkInSchema, documentUploadSchema, eventFormSchema, foundationInformationRequestSchema, intakeFormSchema, intakeNoteSchema, intakeStageSchema, inviteMemberSchema, loginSchema, memberRoleAssignmentSchema, memberStatusUpdateSchema, paymentIntentSchema, profileUpdateSchema, requestAccessSchema, sigmaBetaInterestSchema } from "../../src/lib/validation/schemas";

function randomString(seed: number, length: number) {
  let value = seed >>> 0;
  let output = "";
  for (let index = 0; index < length; index += 1) {
    value = (value * 1664525 + 1013904223) >>> 0;
    output += String.fromCharCode(32 + (value % 95));
  }
  return output;
}

test("initiative schema never throws on fuzzed public payloads", () => {
  for (let seed = 0; seed < 1000; seed += 1) {
    const payload = { initiative: seed % 2 ? "steps" : "black_spending", firstName: randomString(seed, seed % 140), lastName: randomString(seed + 1, seed % 160), durationMinutes: seed - 20, amountCents: seed * -1, steps: seed * -1, spentOn: randomString(seed + 2, 12), trackedOn: randomString(seed + 3, 12), evidencePath: randomString(seed + 4, seed % 600), businessName: randomString(seed + 5, seed % 240), blackOwnedConfirmed: seed % 3 === 0 };
    assert.doesNotThrow(() => initiativeSubmissionSchema.safeParse(payload));
  }
});

test("scholarship schema never throws on fuzzed public payloads", () => {
  for (let seed = 0; seed < 1000; seed += 1) {
    const payload = Object.fromEntries(["scholarship", "legalName", "email", "address", "school", "phone", "dateOfBirth", "citizenship", "race", "ethnicity", "major", "intendedSchool", "essay"].map((field, index) => [field, randomString(seed + index, seed % 300)]));
    assert.doesNotThrow(() => scholarshipApplicationSchema.safeParse({ ...payload, age: seed - 10, gpa: seed - 10, agreement: seed % 2 ? "yes" : "no" }));
  }
});

test("all shared site schemas safely reject or accept arbitrary objects", () => {
  const schemas = [loginSchema, requestAccessSchema, profileUpdateSchema, intakeFormSchema, intakeStageSchema, intakeNoteSchema, eventFormSchema, checkInSchema, documentUploadSchema, paymentIntentSchema, inviteMemberSchema, memberStatusUpdateSchema, memberRoleAssignmentSchema, sigmaBetaInterestSchema, foundationInformationRequestSchema, initiativeSubmissionSchema, scholarshipApplicationSchema];
  for (let seed = 0; seed < 500; seed += 1) {
    const value = JSON.parse(JSON.stringify({ seed, text: randomString(seed, seed % 500), nested: { value: randomString(seed + 1, seed % 80) } }));
    for (const schema of schemas) assert.doesNotThrow(() => schema.safeParse(value));
  }
});

test("URL and redirect guards never throw for fuzzed strings", () => {
  for (let seed = 0; seed < 1000; seed += 1) {
    const value = randomString(seed, seed % 300);
    assert.doesNotThrow(() => isSafeContentActionHref(value));
    assert.doesNotThrow(() => isSafeExternalUrl(value));
    assert.doesNotThrow(() => sanitizeContentAction({ href: value, label: value }));
    assert.doesNotThrow(() => resolveSafeLoginRedirect(value));
  }
});
