import assert from "node:assert/strict";
import test from "node:test";

import * as siteContextModule from "../../src/lib/tenant/site-context.ts";
import {
  DEFAULT_SITE_BRANDING,
  createRootSiteFallback,
  createSiteContext,
} from "../../src/lib/tenant/site-context.ts";

const tenant = {
  chapterId: "00000000-0000-0000-0000-000000000002",
  chapterSlug: "miles",
};

test("creates a collegiate site context with safe branding defaults", () => {
  assert.deepEqual(
    createSiteContext(tenant, {
      id: tenant.chapterId,
      slug: tenant.chapterSlug,
      name: "Alpha Rho Chapter",
      type: "collegiate",
    }),
    {
      chapterId: tenant.chapterId,
      slug: "miles",
      name: "Alpha Rho Chapter",
      siteType: "collegiate",
      branding: DEFAULT_SITE_BRANDING,
    },
  );
});

test("rejects a chapter row that does not match both resolved tenant keys", () => {
  assert.equal(
    createSiteContext(tenant, {
      id: "00000000-0000-0000-0000-000000000003",
      slug: tenant.chapterSlug,
      name: "Another Chapter",
      type: "collegiate",
    }),
    null,
  );
  assert.equal(
    createSiteContext(tenant, {
      id: tenant.chapterId,
      slug: "another-chapter",
      name: "Another Chapter",
      type: "collegiate",
    }),
    null,
  );
});

test("provides a graduate fallback only for the configured root tenant", () => {
  assert.deepEqual(
    createRootSiteFallback({
      chapterId: "00000000-0000-0000-0000-000000000001",
      chapterSlug: "root",
    }),
    {
      chapterId: "00000000-0000-0000-0000-000000000001",
      slug: "root",
      name: "Birmingham Sigmas",
      siteType: "graduate",
      branding: DEFAULT_SITE_BRANDING,
    },
  );
  assert.equal(createRootSiteFallback(tenant), null);
});

test("uses the resolved collegiate chapter identity instead of the Tau Sigma mark", () => {
  const getChapterMark = (
    siteContextModule as typeof siteContextModule & {
      getChapterMark?: (chapter: { name: string; siteType: "graduate" | "collegiate" }) => string;
    }
  ).getChapterMark;

  assert.equal(
    getChapterMark?.({ name: "Alpha Rho Chapter", siteType: "collegiate" }),
    "AR",
  );
  assert.equal(
    getChapterMark?.({ name: "Birmingham Sigmas", siteType: "graduate" }),
    "ΤΣ",
  );
});
