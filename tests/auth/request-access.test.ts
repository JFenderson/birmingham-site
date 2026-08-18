import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import * as requestAccessModule from "../../src/lib/members/request-access.ts";
import * as requestAccessActions from "../../src/app/(public)/request-access/actions.ts";
import { requestAccessSchema } from "../../src/lib/validation/schemas.ts";

const ROOT_CHAPTER_ID = "00000000-0000-4000-8000-000000000001";
const COLLEGIATE_CHAPTER_ID = "00000000-0000-4000-8000-000000000002";
const ROSTER_ID = "00000000-0000-4000-8000-000000000010";
const USER_ID = "00000000-0000-4000-8000-000000000020";

const validInput = {
  membershipNumber: " TS 1914 ",
  lastName: " Bluestone ",
  fullName: "James Bluestone",
  email: "james.bluestone@example.com",
};

function createHeaders(ip = "203.0.113.10") {
  return new Headers({
    "x-forwarded-for": `${ip}, 10.0.0.1`,
    host: "attacker.example",
  });
}

test("request access schema accepts bounded member identifiers and contact fields", () => {
  const parsed = requestAccessSchema.safeParse(validInput);

  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.membershipNumber, "TS 1914");
    assert.equal(parsed.data.lastName, "Bluestone");
    assert.equal(parsed.data.email, "james.bluestone@example.com");
  }
});

test("request access schema rejects script-like and oversized public input", () => {
  assert.equal(
    requestAccessSchema.safeParse({
      ...validInput,
      fullName: "<script>alert(1)</script>",
    }).success,
    false,
  );
  assert.equal(
    requestAccessSchema.safeParse({
      ...validInput,
      membershipNumber: "A".repeat(65),
    }).success,
    false,
  );
});

test("requestRootMemberAccess only creates an invite and claims a profile after a root roster match", async (context) => {
  const inviteCalls: Array<Record<string, unknown>> = [];
  const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = [];

  context.mock.method(
    requestAccessModule.requestAccessDependencies,
    "verifyRootRosterMember",
    async () => ({ matched: true, rosterId: ROSTER_ID }),
  );
  context.mock.method(
    requestAccessModule.requestAccessDependencies,
    "createAdminClient",
    () =>
      ({
        auth: {
          admin: {
            inviteUserByEmail(email: string, options: Record<string, unknown>) {
              inviteCalls.push({ email, options });
              return Promise.resolve({
                data: { user: { id: USER_ID } },
                error: null,
              });
            },
            deleteUser() {
              throw new Error("deleteUser should not run on success");
            },
          },
        },
        rpc(name: string, args: Record<string, unknown>) {
          rpcCalls.push({ name, args });
          return Promise.resolve({ data: true, error: null });
        },
      }) as never,
  );

  const result = await requestAccessModule.requestRootMemberAccess({
    chapterId: ROOT_CHAPTER_ID,
    membershipNumber: validInput.membershipNumber,
    lastName: validInput.lastName,
    fullName: validInput.fullName,
    email: validInput.email,
    redirectTo: "https://staging.birminghamsigmas.org/auth/confirm?next=%2Faccept-invite",
  });

  assert.deepEqual(result, { created: true });
  assert.equal(inviteCalls.length, 1);
  assert.equal(inviteCalls[0]?.email, "james.bluestone@example.com");
  assert.deepEqual(
    (inviteCalls[0]?.options as { data?: Record<string, unknown> }).data,
    {
      full_name: "James Bluestone",
      requested_chapter_id: ROOT_CHAPTER_ID,
      root_roster_id: ROSTER_ID,
    },
  );
  assert.deepEqual(rpcCalls, [
    {
      name: "claim_root_member_access_request",
      args: {
        p_chapter_id: ROOT_CHAPTER_ID,
        p_full_name: "James Bluestone",
        p_profile_id: USER_ID,
        p_roster_id: ROSTER_ID,
      },
    },
  ]);
});

test("requestRootMemberAccess returns a neutral miss without Auth writes when the roster does not match", async (context) => {
  let createAdminCalls = 0;

  context.mock.method(
    requestAccessModule.requestAccessDependencies,
    "verifyRootRosterMember",
    async () => ({ matched: false }),
  );
  context.mock.method(
    requestAccessModule.requestAccessDependencies,
    "createAdminClient",
    () => {
      createAdminCalls += 1;
      return {} as never;
    },
  );

  const result = await requestAccessModule.requestRootMemberAccess({
    chapterId: ROOT_CHAPTER_ID,
    membershipNumber: "TS 0000",
    lastName: "Unknown",
    fullName: "Unknown Brother",
    email: "unknown@example.com",
    redirectTo: "https://staging.birminghamsigmas.org/auth/confirm?next=%2Faccept-invite",
  });

  assert.deepEqual(result, { created: false });
  assert.equal(createAdminCalls, 0);
});

test("requestRootMemberAccess cleans up the invited Auth user when the atomic roster claim loses a duplicate race", async (context) => {
  const deletedUsers: string[] = [];

  context.mock.method(
    requestAccessModule.requestAccessDependencies,
    "verifyRootRosterMember",
    async () => ({ matched: true, rosterId: ROSTER_ID }),
  );
  context.mock.method(
    requestAccessModule.requestAccessDependencies,
    "createAdminClient",
    () =>
      ({
        auth: {
          admin: {
            inviteUserByEmail() {
              return Promise.resolve({
                data: { user: { id: USER_ID } },
                error: null,
              });
            },
            deleteUser(userId: string) {
              deletedUsers.push(userId);
              return Promise.resolve({ error: null });
            },
          },
        },
        rpc() {
          return Promise.resolve({ data: false, error: null });
        },
      }) as never,
  );

  const result = await requestAccessModule.requestRootMemberAccess({
    chapterId: ROOT_CHAPTER_ID,
    membershipNumber: validInput.membershipNumber,
    lastName: validInput.lastName,
    fullName: validInput.fullName,
    email: validInput.email,
    redirectTo: "https://staging.birminghamsigmas.org/auth/confirm?next=%2Faccept-invite",
  });

  assert.deepEqual(result, { created: false });
  assert.deepEqual(deletedUsers, [USER_ID]);
});

test("public request access action is root-only, rate-limited, and returns neutral responses", async (context) => {
  const provisionCalls: Array<Record<string, unknown>> = [];

  context.mock.method(
    requestAccessActions.requestAccessActionDependencies,
    "headers",
    async () => createHeaders(),
  );
  context.mock.method(
    requestAccessActions.requestAccessActionDependencies,
    "getTenantContext",
    async () => ({ chapterId: ROOT_CHAPTER_ID, chapterSlug: "root" }),
  );
  context.mock.method(
    requestAccessActions.requestAccessActionDependencies,
    "checkRateLimit",
    async () => ({ success: true }),
  );
  context.mock.method(
    requestAccessActions.requestAccessActionDependencies,
    "requestRootMemberAccess",
    async (payload: Record<string, unknown>) => {
      provisionCalls.push(payload);
      return { created: true };
    },
  );
  context.mock.method(
    requestAccessActions.requestAccessActionDependencies,
    "getTrustedSiteOrigin",
    () => "https://staging.birminghamsigmas.org",
  );

  const accepted = await requestAccessActions.requestMemberAccess(validInput);
  const invalid = await requestAccessActions.requestMemberAccess({
    ...validInput,
    email: "not an email",
  });

  context.mock.method(
    requestAccessActions.requestAccessActionDependencies,
    "getTenantContext",
    async () => ({ chapterId: COLLEGIATE_CHAPTER_ID, chapterSlug: "miles" }),
  );
  const collegiate = await requestAccessActions.requestMemberAccess(validInput);

  context.mock.method(
    requestAccessActions.requestAccessActionDependencies,
    "checkRateLimit",
    async () => ({ success: false }),
  );
  const limited = await requestAccessActions.requestMemberAccess(validInput);

  assert.deepEqual(accepted, requestAccessActions.NEUTRAL_REQUEST_ACCESS_RESULT);
  assert.deepEqual(invalid, requestAccessActions.NEUTRAL_REQUEST_ACCESS_RESULT);
  assert.deepEqual(collegiate, requestAccessActions.NEUTRAL_REQUEST_ACCESS_RESULT);
  assert.equal(provisionCalls.length, 1);
  assert.match(
    (provisionCalls[0]?.redirectTo as string) ?? "",
    /^https:\/\/staging\.birminghamsigmas\.org\/auth\/confirm\?next=%2Faccept-invite$/,
  );
  assert.deepEqual(limited, {
    success: false,
    error: "Too many requests. Please try again later.",
  });
});

test("root member access claim migration uses a service-role RPC with row locking and duplicate-claim protection", () => {
  const migration = readFileSync(
    new URL(
      "../../supabase/migrations/20260818000001_claim_root_member_access_request.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(migration, /create or replace function public\.claim_root_member_access_request/i);
  assert.match(migration, /auth\.role\(\) <> 'service_role'/i);
  assert.match(migration, /for update/i);
  assert.match(migration, /claimed_profile_id is null/i);
  assert.match(migration, /membership_status = 'pending'::public\.membership_status/i);
  assert.match(migration, /role = 'member'::public\.access_role/i);
  assert.match(migration, /grant execute on function public\.claim_root_member_access_request/i);
  assert.doesNotMatch(migration, /to anon/i);
  assert.doesNotMatch(migration, /using \(true\)/i);
});
