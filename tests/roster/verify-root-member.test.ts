import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import * as rosterModule from "../../src/lib/roster/verify-root-member.ts";

type RosterRow = {
  id: string;
  claimed_profile_id: string | null;
};

type QueryCapture = {
  table: string | null;
  selectColumns: string | null;
  eqs: Array<[string, unknown]>;
};

function createRosterClient(
  resolve: (capture: QueryCapture) => Promise<{ data: RosterRow | null; error: Error | null }>,
) {
  const capture: QueryCapture = {
    table: null,
    selectColumns: null,
    eqs: [],
  };

  const query = {
    select(columns: string) {
      capture.selectColumns = columns;
      return query;
    },
    eq(column: string, value: unknown) {
      capture.eqs.push([column, value]);
      return query;
    },
    maybeSingle() {
      return resolve(capture);
    },
  };

  return {
    capture,
    client: {
      from(table: string) {
        capture.table = table;
        return query;
      },
    },
  };
}

test("verifyRootRosterMember normalizes membership number and last name before matching the root roster", async (context) => {
  const { capture, client } = createRosterClient(async () => ({
    data: {
      id: "00000000-0000-4000-8000-000000000010",
      claimed_profile_id: null,
    },
    error: null,
  }));

  context.mock.method(
    rosterModule.rootRosterVerificationDependencies,
    "createAdminClient",
    () => client as never,
  );

  const result = await rosterModule.verifyRootRosterMember({
    membershipNumber: "  ab 123  ",
    lastName: "  McDANIEL  ",
  });

  assert.deepEqual(result, {
    matched: true,
    rosterId: "00000000-0000-4000-8000-000000000010",
  });
  assert.equal(capture.table, "root_member_roster");
  assert.match(capture.selectColumns ?? "", /\bid\b/);
  assert.match(capture.selectColumns ?? "", /\bclaimed_profile_id\b/);
  assert.deepEqual(capture.eqs, [
    ["membership_number_normalized", "AB123"],
    ["last_name_normalized", "mcdaniel"],
    ["chapters.slug", "root"],
    ["status", "active"],
  ]);
});

test("verifyRootRosterMember is scoped to the root chapter and does not match collegiate roster rows", async (context) => {
  const { capture, client } = createRosterClient(async (query) => {
    const hasRootFilter = query.eqs.some(
      ([column, value]) => column === "chapters.slug" && value === "root",
    );

    return {
      data: hasRootFilter
        ? null
        : {
            id: "00000000-0000-4000-8000-000000000011",
            claimed_profile_id: null,
          },
      error: null,
    };
  });

  context.mock.method(
    rosterModule.rootRosterVerificationDependencies,
    "createAdminClient",
    () => client as never,
  );

  const result = await rosterModule.verifyRootRosterMember({
    membershipNumber: "MILES-001",
    lastName: "Brown",
  });

  assert.deepEqual(result, { matched: false });
  assert.ok(
    capture.eqs.some(
      ([column, value]) => column === "chapters.slug" && value === "root",
    ),
  );
});

test("verifyRootRosterMember returns a neutral miss for already claimed roster rows", async (context) => {
  const { client } = createRosterClient(async () => ({
    data: {
      id: "00000000-0000-4000-8000-000000000012",
      claimed_profile_id: "00000000-0000-4000-8000-000000000099",
    },
    error: null,
  }));

  context.mock.method(
    rosterModule.rootRosterVerificationDependencies,
    "createAdminClient",
    () => client as never,
  );

  const result = await rosterModule.verifyRootRosterMember({
    membershipNumber: "TS-002",
    lastName: "Carter",
  });

  assert.deepEqual(result, { matched: false });
  assert.equal("rosterId" in result, false);
});

test("verifyRootRosterMember returns a neutral miss for duplicate or errored lookups without logging PII", async (context) => {
  const { client } = createRosterClient(async () => ({
    data: null,
    error: Object.assign(new Error("multiple rows returned"), {
      code: "PGRST116",
    }),
  }));

  context.mock.method(
    rosterModule.rootRosterVerificationDependencies,
    "createAdminClient",
    () => client as never,
  );
  const errorCalls: string[] = [];
  context.mock.method(console, "error", (...args: unknown[]) => {
    errorCalls.push(args.map(String).join(" "));
  });

  const result = await rosterModule.verifyRootRosterMember({
    membershipNumber: "TS-PRIVATE-123",
    lastName: "Sensitive",
  });

  assert.deepEqual(result, { matched: false });
  assert.equal("rosterId" in result, false);
  assert.equal(errorCalls.length, 1);
  assert.doesNotMatch(errorCalls[0] ?? "", /TS-PRIVATE-123/);
  assert.doesNotMatch(errorCalls[0] ?? "", /Sensitive/);
});

test("root member roster migration creates a root-only table with RLS and claim protections", () => {
  const migration = readFileSync(
    new URL(
      "../../supabase/migrations/20260818000000_root_member_roster.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(migration, /create table public\.root_member_roster/i);
  assert.match(migration, /membership_number_normalized text not null/i);
  assert.match(migration, /unique \(membership_number_normalized\)/i);
  assert.match(migration, /chapter_id uuid not null references public\.chapters\(id\)/i);
  assert.match(migration, /claimed_profile_id uuid references public\.profiles\(id\)/i);
  assert.match(migration, /alter table public\.root_member_roster enable row level security/i);
  assert.match(migration, /create policy "root_member_roster_admin_read"/i);
  assert.match(migration, /create policy "root_member_roster_admin_update_claim"/i);
  assert.match(migration, /chapters\.slug = 'root'/i);
  assert.match(migration, /root member roster rows must belong to root chapter/i);
  assert.doesNotMatch(migration, /using \(true\)/i);
  assert.doesNotMatch(migration, /to anon/i);
});
