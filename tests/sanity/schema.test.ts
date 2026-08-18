import assert from "node:assert/strict";
import test from "node:test";

import { sanitySchemaTypes } from "../../src/sanity/schema/index.ts";
import { getChapterSlugOptions } from "../../src/sanity/schema/shared.ts";

test("chapter options include root and configured collegiate slugs in a readable list", () => {
  const options = getChapterSlugOptions({
    CHAPTER_SLUG_MAP:
      '{"root":"00000000-0000-0000-0000-000000000001","miles":"00000000-0000-0000-0000-000000000002","talladega":"00000000-0000-0000-0000-000000000003"}',
  });

  assert.deepEqual(options, [
    { title: "Root chapter (root)", value: "root" },
    { title: "Miles chapter (miles)", value: "miles" },
    { title: "Talladega chapter (talladega)", value: "talladega" },
  ]);
});

test("schema registry includes the gallery and video document types", () => {
  const schemaNames = sanitySchemaTypes.map((schema) => schema.name);

  assert.ok(schemaNames.includes("gallery"));
  assert.ok(schemaNames.includes("video"));
});
