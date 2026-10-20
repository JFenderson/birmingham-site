import assert from "node:assert/strict";
import test from "node:test";

test("published community events include optional flyer assets and alt text", async () => {
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= "test-project";
  const { getPublishedEvents } = await import("../../src/sanity/queries.ts");
  const { getSanityImageUrl } = await import("../../src/sanity/image-url.ts");
  const calls: string[] = [];
  const expected = [{
    _id: "event-1",
    title: "Community gathering",
    description: "An event with a flyer.",
    image: { asset: { _ref: "image-example-800x1000-png" }, alt: "Community gathering flyer" },
    order: 1,
    publishedAt: "2026-10-20T12:00:00.000Z",
  }];
  const events = await getPublishedEvents("root", {
    async fetch<T>(query: string): Promise<T> {
      calls.push(query);
      return expected as T;
    },
  });

  assert.deepEqual(events, expected);
  assert.match(calls[0]!, /image\s*\{\s*\.\.\.,\s*alt\s*\}/);
  assert.match(calls[0]!, /chapterSlug == \$chapterSlug/);
  assert.match(calls[0]!, /published == true/);
  assert.match(getSanityImageUrl(expected[0]!.image, 640, 880, "max") ?? "", /fit=max/);
});
