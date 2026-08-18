import assert from "node:assert/strict";
import test from "node:test";

import {
  getSanityClientConfig,
  getSanityStudioConfig,
} from "../../src/sanity/config.ts";

test("client config prefers NEXT_PUBLIC vars and falls back to server aliases", () => {
  const config = getSanityClientConfig({
    NEXT_PUBLIC_SANITY_PROJECT_ID: "public-project",
    SANITY_PROJECT_ID: "server-project",
    NEXT_PUBLIC_SANITY_DATASET: "staging",
    SANITY_DATASET: "development",
    NODE_ENV: "test",
  });

  assert.equal(config.projectId, "public-project");
  assert.equal(config.dataset, "staging");
  assert.equal(config.useCdn, false);
  assert.equal(config.apiVersion, "2026-01-01");
});

test("client config uses server aliases when NEXT_PUBLIC vars are absent", () => {
  const config = getSanityClientConfig({
    SANITY_PROJECT_ID: "server-project",
    SANITY_DATASET: "preview",
    NODE_ENV: "production",
  });

  assert.equal(config.projectId, "server-project");
  assert.equal(config.dataset, "preview");
  assert.equal(config.useCdn, true);
});

test("client config defaults the dataset to production", () => {
  const config = getSanityClientConfig({
    SANITY_PROJECT_ID: "server-project",
    NODE_ENV: "development",
  });

  assert.equal(config.dataset, "production");
});

test("client config throws when project ID is missing", () => {
  assert.throws(
    () => getSanityClientConfig({ NEXT_PUBLIC_SANITY_DATASET: "production" }),
    /Sanity is not configured/,
  );
});

test("studio config requires a public project ID and resolves the dataset", () => {
  const config = getSanityStudioConfig({
    NEXT_PUBLIC_SANITY_PROJECT_ID: "studio-project",
    SANITY_PROJECT_ID: "server-project",
    NEXT_PUBLIC_SANITY_DATASET: "editorial",
    SANITY_DATASET: "preview",
  });

  assert.equal(config.projectId, "studio-project");
  assert.equal(config.dataset, "editorial");
});

test("studio config rejects missing public project ID instead of using a fallback", () => {
  assert.throws(
    () =>
      getSanityStudioConfig({
        SANITY_PROJECT_ID: "server-project",
        NEXT_PUBLIC_SANITY_DATASET: "production",
      }),
    /NEXT_PUBLIC_SANITY_PROJECT_ID/,
  );
});
