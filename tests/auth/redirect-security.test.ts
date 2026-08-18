import assert from "node:assert/strict";
import test from "node:test";

import { resolveSafeLoginRedirect } from "../../src/lib/security/redirects.ts";
import { getTrustedSiteOrigin } from "../../src/lib/security/redirects.ts";

test("login redirect accepts only same-origin relative paths", () => {
  assert.equal(resolveSafeLoginRedirect("/events?view=upcoming", "/dashboard"), "/events?view=upcoming");
  assert.equal(resolveSafeLoginRedirect("https://evil.example/phish", "/dashboard"), "/dashboard");
  assert.equal(resolveSafeLoginRedirect("//evil.example/phish", "/dashboard"), "/dashboard");
  assert.equal(resolveSafeLoginRedirect("javascript:alert(1)", "/dashboard"), "/dashboard");
});

test("trusted site origin uses configured origins and ignores request hosts", () => {
  assert.equal(
    getTrustedSiteOrigin({
      siteUrl: "https://staging.birminghamsigmas.org/some-path",
      rootDomain: "birminghamsigmas.org",
      stagingHost: "attacker.example",
      nodeEnv: "production",
    }),
    "https://staging.birminghamsigmas.org",
  );
  assert.equal(
    getTrustedSiteOrigin({
      siteUrl: "",
      rootDomain: "birminghamsigmas.org",
      stagingHost: "staging.birminghamsigmas.org",
      nodeEnv: "production",
    }),
    "https://staging.birminghamsigmas.org",
  );
  assert.equal(
    getTrustedSiteOrigin({
      siteUrl: "",
      rootDomain: "birminghamsigmas.org",
      stagingHost: "",
      nodeEnv: "production",
    }),
    "https://birminghamsigmas.org",
  );
});
