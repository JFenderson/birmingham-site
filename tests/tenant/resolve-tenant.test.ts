import assert from "node:assert/strict";
import test from "node:test";

import { resolveTenant } from "../../src/lib/tenant/resolve-tenant.ts";

const slugMap = {
  root: "00000000-0000-0000-0000-000000000001",
  miles: "00000000-0000-0000-0000-000000000002",
};

test("resolves the configured root host after normalizing case and port", () => {
  assert.deepEqual(
    resolveTenant("WWW.BirminghamSigmas.org:443", new URLSearchParams(), {
      nodeEnv: "production",
      rootDomain: "birminghamsigmas.org",
      slugMap,
    }),
    { chapterId: slugMap.root, chapterSlug: "root" },
  );
});

test("resolves a configured collegiate subdomain", () => {
  assert.deepEqual(
    resolveTenant("miles.birminghamsigmas.org", new URLSearchParams(), {
      nodeEnv: "production",
      rootDomain: "birminghamsigmas.org",
      slugMap,
    }),
    { chapterId: slugMap.miles, chapterSlug: "miles" },
  );
});

test("keeps localhost mapped to the root tenant when no root domain is configured", () => {
  assert.deepEqual(
    resolveTenant("localhost:3000", new URLSearchParams(), {
      nodeEnv: "development",
      rootDomain: "",
      slugMap,
    }),
    { chapterId: slugMap.root, chapterSlug: "root" },
  );
});

test("rejects an unknown production host instead of exposing the root chapter", () => {
  assert.equal(
    resolveTenant("unknown.example", new URLSearchParams(), {
      nodeEnv: "production",
      rootDomain: "birminghamsigmas.org",
      slugMap,
    }),
    null,
  );
});

test("allows a known tenant override only on the shared Vercel preview domain", () => {
  const params = new URLSearchParams({ __tenant: "miles" });

  assert.deepEqual(
    resolveTenant("tau-sigma-git-main.vercel.app", params, {
      nodeEnv: "production",
      rootDomain: "birminghamsigmas.org",
      slugMap,
    }),
    { chapterId: slugMap.miles, chapterSlug: "miles" },
  );
  assert.equal(
    resolveTenant("unknown.example", params, {
      nodeEnv: "production",
      rootDomain: "birminghamsigmas.org",
      slugMap,
    }),
    null,
  );
});
