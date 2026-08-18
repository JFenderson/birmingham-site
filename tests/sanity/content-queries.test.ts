import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= "test-project";

const {
  getPublishedEvents,
  getPublishedLeaders,
  getPublishedPostBySlug,
  getPublishedPostSummaries,
  getPublishedPrograms,
} = await import("../../src/sanity/queries.ts");

interface FetchCall {
  query: string;
  params: Record<string, unknown>;
}

function recordingClient(result: unknown) {
  const calls: FetchCall[] = [];

  return {
    calls,
    client: {
      async fetch<T>(query: string, params: Record<string, unknown>): Promise<T> {
        calls.push({ query, params });
        return result as T;
      },
    },
  };
}

function assertPublishedTenantQuery(
  call: FetchCall,
  documentType: "event" | "program" | "leader" | "post",
) {
  assert.match(call.query, new RegExp(`_type == "${documentType}"`));
  assert.match(call.query, /chapterSlug == \$chapterSlug/);
  assert.match(call.query, /published == true/);
  assert.doesNotMatch(call.query, /chapterSlug == "root"/);
  assert.equal(call.params.chapterSlug, "miles");
}

function assertPublishedPostQuery(call: FetchCall) {
  assertPublishedTenantQuery(call, "post");
  assert.match(call.query, /!\(_id in path\("drafts\.\*\*"\)\)/);
  assert.match(call.query, /defined\(publishedAt\)/);
  assert.match(call.query, /publishedAt <= now\(\)/);
  assert.doesNotMatch(call.query, /pt::text\(body\)/);
}

test("events query returns only the requested tenant's published ordered records", async () => {
  const expected = [
    {
      _id: "event-1",
      title: "Scholarship",
      description: "Scholarship support for graduating seniors.",
      order: 1,
      publishedAt: "2026-08-01T12:00:00.000Z",
    },
  ];
  const { calls, client } = recordingClient(expected);

  const result = await getPublishedEvents("miles", client);

  assert.deepEqual(result, expected);
  assert.equal(calls.length, 1);
  assertPublishedTenantQuery(calls[0]!, "event");
  assert.match(calls[0]!.query, /order\(order asc/);
  assert.match(calls[0]!.query, /publishedAt <= now\(\)/);
});

test("programs query returns only the requested tenant's published ordered records", async () => {
  const expected = [
    {
      _id: "program-1",
      title: "Youth Support",
      description: "Mentoring and educational advancement.",
      order: 2,
    },
  ];
  const { calls, client } = recordingClient(expected);

  const result = await getPublishedPrograms("miles", client);

  assert.deepEqual(result, expected);
  assert.equal(calls.length, 1);
  assertPublishedTenantQuery(calls[0]!, "program");
  assert.match(calls[0]!.query, /order\(order asc/);
});

test("leaders query returns only the requested tenant's published ordered records", async () => {
  const expected = [
    {
      _id: "leader-1",
      name: "Bro. Example",
      role: "Chapter President",
      order: 1,
    },
  ];
  const { calls, client } = recordingClient(expected);

  const result = await getPublishedLeaders("miles", client);

  assert.deepEqual(result, expected);
  assert.equal(calls.length, 1);
  assertPublishedTenantQuery(calls[0]!, "leader");
  assert.match(calls[0]!.query, /order\(order asc/);
});

test("post summaries query returns only published tenant posts safe for public listing", async () => {
  const expected = [
    {
      _id: "post-1",
      title: "Chapter Cookout",
      slug: "chapter-cookout",
      publishedAt: "2026-08-01T12:00:00.000Z",
      coverImage: { asset: { _ref: "image-ref" }, alt: "Brothers serving food" },
      excerpt: "The chapter hosted neighbors for an afternoon cookout.",
    },
  ];
  const { calls, client } = recordingClient(expected);

  const result = await getPublishedPostSummaries("miles", client);

  assert.deepEqual(result, expected);
  assert.equal(calls.length, 1);
  assertPublishedPostQuery(calls[0]!);
  assert.match(calls[0]!.query, /order\(publishedAt desc/);
});

test("post detail query returns one published tenant post by slug", async () => {
  const expected = {
    _id: "post-1",
    title: "Chapter Cookout",
    slug: "chapter-cookout",
    publishedAt: "2026-08-01T12:00:00.000Z",
    coverImage: { asset: { _ref: "image-ref" }, alt: "Brothers serving food" },
    body: [{ _type: "block", children: [{ _type: "span", text: "Story" }] }],
  };
  const { calls, client } = recordingClient(expected);

  const result = await getPublishedPostBySlug("miles", "chapter-cookout", client);

  assert.deepEqual(result, expected);
  assert.equal(calls.length, 1);
  assertPublishedPostQuery(calls[0]!);
  assert.match(calls[0]!.query, /slug\.current == \$slug/);
  assert.deepEqual(calls[0]!.params, { chapterSlug: "miles", slug: "chapter-cookout" });
});

test("content queries return an empty list when Sanity is unavailable", async (context) => {
  context.mock.method(console, "error", () => undefined);
  const client = {
    async fetch<T>(): Promise<T> {
      throw new Error("Sanity unavailable");
    },
  };

  assert.deepEqual(await getPublishedEvents("root", client), []);
  assert.deepEqual(await getPublishedPrograms("root", client), []);
  assert.deepEqual(await getPublishedLeaders("root", client), []);
  assert.deepEqual(await getPublishedPostSummaries("root", client), []);
  assert.equal(await getPublishedPostBySlug("root", "missing-post", client), null);
});
