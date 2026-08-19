import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= "test-project";

const {
  getPublishedCurrentExecutiveLeaders,
  getPublishedEvents,
  getPublishedGalleries,
  getPublishedHomepageSettings,
  getPublishedLeadershipPageLeaders,
  getPublishedLeaders,
  getPublishedPastPresidents,
  getPublishedPostBySlug,
  getPublishedPostSummaries,
  getPublishedPrograms,
  getPublishedVideos,
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
  documentType:
    | "event"
    | "gallery"
    | "leader"
    | "pastPresident"
    | "post"
    | "program"
    | "siteSettings"
    | "video",
) {
  assert.match(call.query, new RegExp(`_type == "${documentType}"`));
  assert.match(call.query, /chapterSlug == \$chapterSlug/);
  assert.match(call.query, /published == true/);
  assert.match(call.query, /!\(_id in path\("drafts\.\*\*"\)\)/);
  assert.doesNotMatch(call.query, /chapterSlug == "root"/);
  assert.equal(call.params.chapterSlug, "miles");
}

function assertPublishedPostQuery(call: FetchCall) {
  assertPublishedTenantQuery(call, "post");
  assert.match(call.query, /defined\(publishedAt\)/);
  assert.match(call.query, /publishedAt <= now\(\)/);
  assert.doesNotMatch(call.query, /pt::text\(body\)/);
}

function assertPublishedEditorialMediaQuery(call: FetchCall, documentType: "gallery" | "video") {
  assertPublishedTenantQuery(call, documentType);
  assert.match(call.query, /defined\(publishedAt\)/);
  assert.match(call.query, /publishedAt <= now\(\)/);
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
  assert.match(calls[0]!.query, /order\(order asc, publishedAt desc, _id asc\)/);
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
  assert.match(calls[0]!.query, /order\(order asc, title asc, _id asc\)/);
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
  assert.match(calls[0]!.query, /order\(order asc, name asc, _id asc\)/);
});

test("current executive leaders query filters published tenant leaders by designation", async () => {
  const expected = [
    {
      _id: "leader-1",
      name: "Bro. Example",
      role: "Chapter President",
      designation: "currentExecutive",
      portrait: { asset: { _ref: "image-ref" }, alt: "Bro. Example portrait" },
      bio: "Focused on brotherhood, scholarship, and service.",
      order: 1,
    },
  ];
  const { calls, client } = recordingClient(expected);

  const result = await getPublishedCurrentExecutiveLeaders("miles", client);

  assert.deepEqual(result, expected);
  assert.equal(calls.length, 1);
  assertPublishedTenantQuery(calls[0]!, "leader");
  assert.match(calls[0]!.query, /designation == "currentExecutive"/);
  assert.match(calls[0]!.query, /portrait \{/);
  assert.match(calls[0]!.query, /bio/);
  assert.match(calls[0]!.query, /order\(order asc, name asc, _id asc\)/);
});

test("leadership page leaders query includes current executive and board designations in deterministic order", async () => {
  const expected = [
    {
      _id: "leader-1",
      name: "Bro. Current Executive",
      role: "Chapter President",
      designation: "currentExecutive",
      portrait: { asset: { _ref: "image-ref" }, alt: "Bro. Current Executive portrait" },
      bio: "Focused on brotherhood, scholarship, and service.",
      order: 1,
    },
    {
      _id: "leader-2",
      name: "Bro. Board Member",
      role: "Board Member",
      designation: "board",
      portrait: { asset: { _ref: "board-ref" }, alt: "Bro. Board Member portrait" },
      bio: null,
      order: 1,
    },
  ];
  const { calls, client } = recordingClient(expected);

  const result = await getPublishedLeadershipPageLeaders("miles", client);

  assert.deepEqual(result, expected);
  assert.equal(calls.length, 1);
  assertPublishedTenantQuery(calls[0]!, "leader");
  assert.match(calls[0]!.query, /designation in \["currentExecutive", "board"\]/);
  assert.match(calls[0]!.query, /portrait \{/);
  assert.match(calls[0]!.query, /bio/);
  assert.match(
    calls[0]!.query,
    /order\(select\(designation == "currentExecutive" => 0, designation == "board" => 1, 2\) asc, order asc, name asc, _id asc\)/,
  );
});

test("homepage settings query returns one published tenant singleton with editable sections", async () => {
  const expected = {
    _id: "site-settings-root",
    chapterSlug: "miles",
    hero: {
      eyebrow: "Birmingham Sigmas",
      title: "Service in action",
      description: "A chapter committed to community impact.",
      primaryAction: { href: "/about", label: "About us" },
      secondaryAction: { href: "/contact", label: "Contact us" },
      image: { asset: { _ref: "image-ref" }, alt: "Brothers serving the community" },
    },
    communityImpact: {
      eyebrow: "Community impact",
      title: "Service that meets Birmingham where it is",
      description: "Signature initiatives throughout the year.",
      initiatives: [],
    },
    featuredPresident: {
      eyebrow: "From the president",
      title: "Service-driven leadership",
      description: "A note from chapter leadership.",
      name: "Bro. Example",
      role: "Chapter President",
      image: { asset: { _ref: "president-ref" }, alt: "Chapter president portrait" },
      link: { href: "/photos", label: "View chapter moments" },
    },
  };
  const { calls, client } = recordingClient(expected);

  const result = await getPublishedHomepageSettings("miles", client);

  assert.deepEqual(result, expected);
  assert.equal(calls.length, 1);
  assertPublishedTenantQuery(calls[0]!, "siteSettings");
  assert.match(calls[0]!.query, /defined\(publishedAt\)/);
  assert.match(calls[0]!.query, /publishedAt <= now\(\)/);
  assert.match(calls[0]!.query, /\] \| order\(publishedAt desc, _updatedAt desc, _id asc\)\[0\]/);
  assert.match(calls[0]!.query, /featuredPresident/);
});

test("past presidents query returns published tenant presidents with optional featured portrait", async () => {
  const expected = [
    {
      _id: "past-president-1",
      name: "Bro. Past President",
      yearsServed: "2018-2020",
      order: 1,
      featured: true,
      portrait: { asset: { _ref: "portrait-ref" }, alt: "Bro. Past President portrait" },
      bio: "Led the chapter through major service initiatives.",
    },
  ];
  const { calls, client } = recordingClient(expected);

  const result = await getPublishedPastPresidents("miles", client);

  assert.deepEqual(result, expected);
  assert.equal(calls.length, 1);
  assertPublishedTenantQuery(calls[0]!, "pastPresident");
  assert.match(calls[0]!.query, /defined\(publishedAt\)/);
  assert.match(calls[0]!.query, /publishedAt <= now\(\)/);
  assert.match(calls[0]!.query, /order\(order asc, yearsServed desc, name asc, _id asc\)/);
  assert.match(calls[0]!.query, /portrait \{/);
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
  assert.match(calls[0]!.query, /order\(publishedAt desc, _id asc\)/);
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

test("gallery query returns only published tenant galleries in deterministic newest-event order", async () => {
  const expected = [
    {
      _id: "gallery-1",
      title: "Founders Day",
      slug: "founders-day",
      eventDate: "2026-08-10",
      publishedAt: "2026-08-12T15:30:00.000Z",
      description: "Chapter service and fellowship highlights.",
      coverImage: { asset: { _ref: "gallery-cover" }, alt: "Brothers posing outdoors" },
      photos: [
        {
          asset: { _ref: "gallery-photo-1" },
          alt: "Brothers volunteering together",
          caption: "Community service kickoff",
        },
      ],
    },
  ];
  const { calls, client } = recordingClient(expected);

  const result = await getPublishedGalleries("miles", client);

  assert.deepEqual(result, expected);
  assert.equal(calls.length, 1);
  assertPublishedEditorialMediaQuery(calls[0]!, "gallery");
  assert.match(calls[0]!.query, /order\(eventDate desc, publishedAt desc, title asc, _id asc\)/);
});

test("video query returns only published tenant videos in deterministic newest-publication order", async () => {
  const expected = [
    {
      _id: "video-1",
      title: "Leadership Summit Recap",
      provider: "youtube",
      url: "https://www.youtube.com/watch?v=abc123",
      publishedAt: "2026-08-11T12:00:00.000Z",
      description: "Highlights from the annual summit.",
      thumbnail: { asset: { _ref: "video-thumb" }, alt: "Speaker at the podium" },
    },
  ];
  const { calls, client } = recordingClient(expected);

  const result = await getPublishedVideos("miles", client);

  assert.deepEqual(result, expected);
  assert.equal(calls.length, 1);
  assertPublishedEditorialMediaQuery(calls[0]!, "video");
  assert.match(calls[0]!.query, /order\(publishedAt desc, title asc, _id asc\)/);
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
  assert.deepEqual(await getPublishedCurrentExecutiveLeaders("root", client), []);
  assert.deepEqual(await getPublishedLeadershipPageLeaders("root", client), []);
  assert.deepEqual(await getPublishedPastPresidents("root", client), []);
  assert.deepEqual(await getPublishedGalleries("root", client), []);
  assert.deepEqual(await getPublishedVideos("root", client), []);
  assert.deepEqual(await getPublishedPostSummaries("root", client), []);
  assert.equal(await getPublishedPostBySlug("root", "missing-post", client), null);
  assert.equal(await getPublishedHomepageSettings("root", client), null);
});
