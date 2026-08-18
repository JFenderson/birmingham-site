import assert from "node:assert/strict";
import test from "node:test";

import { getPortalNavigationSections } from "../../src/components/portal/portal-navigation.ts";

test("member navigation exposes the five primary portal destinations", () => {
  const navigation = getPortalNavigationSections("Member");

  assert.deepEqual(
    navigation.primary.map((item) => item.label),
    ["Home", "Events", "Vault", "Pay", "Account"],
  );
  assert.equal(navigation.primary.length, 5);
  assert.deepEqual(
    navigation.primary.map((item) => item.href),
    ["/dashboard", "/events", "/vault", "/pay", "/account"],
  );
  assert.deepEqual(navigation.chapterTools, []);
});

test("admin navigation adds intake, invite brother, and admin chapter tools", () => {
  const navigation = getPortalNavigationSections("Admin");

  assert.equal(navigation.primary.length, 5);
  assert.deepEqual(
    navigation.chapterTools.map((item) => item.label),
    ["Intake", "Invite Brother", "Admin"],
  );
  assert.deepEqual(
    navigation.chapterTools.map((item) => item.href),
    ["/intake", "/members/invite", "/admin"],
  );
});
