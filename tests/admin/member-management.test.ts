import assert from "node:assert/strict";
import test from "node:test";

import {
  memberIdSchema,
  memberRoleSchema,
  membershipStatusSchema,
} from "../../src/lib/validation/schemas.ts";
import {
  getRoleAssignmentError,
  getStatusChangeError,
  getStatusTransitionError,
} from "../../src/lib/members/member-management.ts";

const ACTOR_ID = "00000000-0000-4000-8000-000000000001";
const TARGET_ID = "00000000-0000-4000-8000-000000000002";

test("member-management schemas reject malformed ids, statuses, and roles", () => {
  assert.equal(memberIdSchema.safeParse("not-a-uuid").success, false);
  assert.equal(membershipStatusSchema.safeParse("active").success, false);
  assert.equal(memberRoleSchema.safeParse("Admin").success, false);
});

test("member-management schemas accept database authorization values", () => {
  assert.equal(memberIdSchema.safeParse(TARGET_ID).success, true);

  for (const status of ["pending", "approved", "suspended"]) {
    assert.equal(membershipStatusSchema.safeParse(status).success, true);
  }

  for (const role of ["member", "chapter_admin", "super_admin"]) {
    assert.equal(memberRoleSchema.safeParse(role).success, true);
  }
});

test("allows only pending approval, approved suspension, and suspended restoration", () => {
  assert.equal(getStatusTransitionError("pending", "approved"), null);
  assert.equal(getStatusTransitionError("approved", "suspended"), null);
  assert.equal(getStatusTransitionError("suspended", "approved"), null);

  assert.match(
    getStatusTransitionError("pending", "suspended") ?? "",
    /cannot move from pending to suspended/i,
  );
  assert.match(
    getStatusTransitionError("approved", "approved") ?? "",
    /cannot move from approved to approved/i,
  );
  assert.match(
    getStatusTransitionError("suspended", "suspended") ?? "",
    /cannot move from suspended to suspended/i,
  );
});

test("rejects chapter-admin attempts to grant the super-admin role", () => {
  assert.match(
    getRoleAssignmentError({
      actorId: ACTOR_ID,
      actorRole: "chapter_admin",
      targetId: TARGET_ID,
      currentRole: "member",
      nextRole: "super_admin",
    }) ?? "",
    /only a super administrator/i,
  );
});

test("rejects self-demotion for chapter and super administrators", () => {
  assert.match(
    getRoleAssignmentError({
      actorId: ACTOR_ID,
      actorRole: "chapter_admin",
      targetId: ACTOR_ID,
      currentRole: "chapter_admin",
      nextRole: "member",
    }) ?? "",
    /cannot remove your own administrator access/i,
  );
  assert.match(
    getRoleAssignmentError({
      actorId: ACTOR_ID,
      actorRole: "super_admin",
      targetId: ACTOR_ID,
      currentRole: "super_admin",
      nextRole: "chapter_admin",
    }) ?? "",
    /cannot remove your own administrator access/i,
  );
});

test("rejects self-suspension because the actor could not restore their own access", () => {
  assert.match(
    getStatusChangeError({
      actorId: ACTOR_ID,
      targetId: ACTOR_ID,
      currentStatus: "approved",
      nextStatus: "suspended",
    }) ?? "",
    /cannot change your own membership status/i,
  );
});

test("allows authorized role changes for other members", () => {
  assert.equal(
    getRoleAssignmentError({
      actorId: ACTOR_ID,
      actorRole: "chapter_admin",
      targetId: TARGET_ID,
      currentRole: "member",
      nextRole: "chapter_admin",
    }),
    null,
  );
  assert.equal(
    getRoleAssignmentError({
      actorId: ACTOR_ID,
      actorRole: "super_admin",
      targetId: TARGET_ID,
      currentRole: "chapter_admin",
      nextRole: "super_admin",
    }),
    null,
  );
});

test("rejects role assignments that do not change the role", () => {
  assert.match(
    getRoleAssignmentError({
      actorId: ACTOR_ID,
      actorRole: "super_admin",
      targetId: TARGET_ID,
      currentRole: "member",
      nextRole: "member",
    }) ?? "",
    /already has that role/i,
  );
});
