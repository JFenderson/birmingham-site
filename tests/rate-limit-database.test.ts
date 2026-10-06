import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

import {
  hashRateLimitKey,
  isScriptPermissionError,
} from "../src/lib/rate-limit/database.ts";

test("rate-limit fallback recognizes Redis ACL errors and hashes visitor keys", () => {
  assert.equal(isScriptPermissionError(new Error("NOPERM this user cannot run 'evalsha'")), true);
  assert.equal(isScriptPermissionError(new Error("Redis unavailable")), false);
  const hash = hashRateLimitKey("203.0.113.20:form", 5, 600_000, "preview");
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.notEqual(hash, hashRateLimitKey("203.0.113.20:form", 5, 600_000, "production"));
});

test("private database counter allows up to the configured limit", async (context) => {
  const db = new PGlite();
  context.after(() => db.close());
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  await db.exec(readFileSync("supabase/migrations/20261006185000_request_rate_limit_windows.sql", "utf8"));
  await db.exec("grant usage on schema public to service_role, anon, authenticated; set role service_role;");

  const key = hashRateLimitKey("203.0.113.20:form", 2, 60_000, "test");
  for (const expected of [true, true, false]) {
    const result = await db.query<{ allowed: boolean }>(
      "select public.check_request_rate_limit($1, 2, 60000) as allowed",
      [key],
    );
    assert.equal(result.rows[0]?.allowed, expected);
  }

  await db.exec("reset role; set role anon;");
  await assert.rejects(() => db.query("select * from public.request_rate_limit_windows"), /permission denied/);
  await assert.rejects(
    () => db.query("select public.check_request_rate_limit($1, 2, 60000)", [key]),
    /permission denied/,
  );
});
