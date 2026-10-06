import assert from "node:assert/strict";
import test from "node:test";

import {
  checkFixedWindowLimit,
  isScriptPermissionError,
} from "../src/lib/rate-limit/fixed-window.ts";

test("fallback recognizes a script ACL failure", () => {
  assert.equal(isScriptPermissionError(new Error("Command failed: NOPERM this user has no permissions to run the 'evalsha' command")), true);
  assert.equal(isScriptPermissionError(new Error("Redis unavailable")), false);
});

test("fixed-window fallback limits requests using atomic counters", async () => {
  const counts = new Map<string, number>();
  const expirations: Array<[string, number]> = [];
  const store = {
    async incr(key: string) {
      const next = (counts.get(key) ?? 0) + 1;
      counts.set(key, next);
      return next;
    },
    async expire(key: string, seconds: number) {
      expirations.push([key, seconds]);
      return 1;
    },
  };

  assert.equal(await checkFixedWindowLimit(store, "ip:form", 2, 60_000, "preview", 10_000), true);
  assert.equal(await checkFixedWindowLimit(store, "ip:form", 2, 60_000, "preview", 11_000), true);
  assert.equal(await checkFixedWindowLimit(store, "ip:form", 2, 60_000, "preview", 12_000), false);
  assert.equal(await checkFixedWindowLimit(store, "ip:form", 2, 60_000, "preview", 61_000), true);
  assert.equal(counts.size, 2);
  assert.ok(expirations.every(([, seconds]) => seconds === 120));
});
