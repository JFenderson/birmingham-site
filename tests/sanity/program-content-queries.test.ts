import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= "test-project";

const {
  getSigmaBetaSettings,
  getSigmaBetaEvents,
  getFoundationSettings,
  getFoundationProjects,
  getFoundationEvents,
  getFoundationBoardMembers,
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
    | "sigmaBetaSettings"
    | "sigmaBetaEvent"
    | "foundationSettings"
    | "foundationProject"
    | "foundationEvent"
    | "foundationBoardMember",
) {
  assert.match(call.query, new RegExp(`_type == "${documentType}"`));
  assert.match(call.query, /chapterSlug == \$chapterSlug/);
  assert.match(call.query, /published == true/);
  assert.match(call.query, /!\(_id in path\("drafts\.\*\*"\)\)/);
  assert.doesNotMatch(call.query, /chapterSlug == "root"/);
  assert.equal(call.params.chapterSlug, "miles");
}

function assertRequiredPublishedAtQuery(call: FetchCall) {
  assert.match(call.query, /defined\(publishedAt\)/);
  assert.match(call.query, /publishedAt <= now\(\)/);
}

function assertFinalOrderTiebreaker(call: FetchCall) {
  assert.match(call.query, /_id asc\)/);
}

test("sigma beta settings query returns one published tenant singleton", async () => {
  const expected = {
    _id: "sigma-beta-settings-root",
    chapterSlug: "miles",
    overview: "Program overview",
    mission: "Program mission",
    heroImage: { asset: { _ref: "hero-ref" }, alt: "Sigma Beta hero" },
    directorContact: { label: "Director", email: "director@example.com", phone: null },
    advisors: [
      {
        name: "Advisor One",
        role: "Lead advisor",
        bio: "Bio",
        portrait: { asset: { _ref: "portrait-ref" }, alt: "Advisor portrait" },
      },
    ],
    interestFormIntro: "Interest form intro",
  };
  const { calls, client } = recordingClient(expected);

  const result = await getSigmaBetaSettings("miles", client);

  assert.deepEqual(result, expected);
  assert.equal(calls.length, 1);
  assertPublishedTenantQuery(calls[0]!, "sigmaBetaSettings");
  assertRequiredPublishedAtQuery(calls[0]!);
  assert.match(
    calls[0]!.query,
    /\] \| order\(publishedAt desc, _updatedAt desc, _id asc\)\[0\]/,
  );
  assert.match(calls[0]!.query, /advisors/);
  assert.match(calls[0]!.query, /coalesce\(advisors/);
  assert.match(calls[0]!.query, /directorContact/);
});

test("sigma beta events query returns only the requested tenant's published ordered records", async () => {
  const expected = [
    {
      _id: "sigma-beta-event-1",
      title: "Fall Kickoff",
      slug: "fall-kickoff",
      description: "Kickoff event",
      eventDate: "2026-09-01T12:00:00.000Z",
      location: "Chapter house",
      registrationUrl: "/sigma-beta-club",
      image: { asset: { _ref: "image-ref" }, alt: "Kickoff photo" },
      order: 1,
    },
  ];
  const { calls, client } = recordingClient(expected);

  const result = await getSigmaBetaEvents("miles", client);

  assert.deepEqual(result, expected);
  assert.equal(calls.length, 1);
  assertPublishedTenantQuery(calls[0]!, "sigmaBetaEvent");
  assertRequiredPublishedAtQuery(calls[0]!);
  assert.match(calls[0]!.query, /order\(order asc, eventDate asc, _id asc\)/);
  assertFinalOrderTiebreaker(calls[0]!);
  assert.match(calls[0]!.query, /"slug": slug\.current/);
  assert.match(calls[0]!.query, /registrationUrl/);
  assert.match(calls[0]!.query, /eventDate >= now\(\)/);
});

test("foundation settings query returns one published tenant singleton", async () => {
  const expected = {
    _id: "foundation-settings-root",
    chapterSlug: "miles",
    nonprofitName: "Tau Sigma Charity Foundation",
    taxStatusStatement: "501(c)(3) statement",
    purpose: "Purpose",
    overview: "Overview",
    donationUrl: "/foundation",
    infoRequestIntro: "Info request intro",
    contactEmail: "foundation@example.com",
    heroImage: { asset: { _ref: "hero-ref" }, alt: "Foundation hero" },
  };
  const { calls, client } = recordingClient(expected);

  const result = await getFoundationSettings("miles", client);

  assert.deepEqual(result, expected);
  assert.equal(calls.length, 1);
  assertPublishedTenantQuery(calls[0]!, "foundationSettings");
  assertRequiredPublishedAtQuery(calls[0]!);
  assert.match(
    calls[0]!.query,
    /\] \| order\(publishedAt desc, _updatedAt desc, _id asc\)\[0\]/,
  );
  assert.match(calls[0]!.query, /donationUrl/);
});

test("foundation projects query returns only the requested tenant's published ordered records", async () => {
  const expected = [
    {
      _id: "foundation-project-1",
      title: "Scholarship Fund",
      description: "Scholarship support",
      date: "2026-05-01",
      projectType: "Scholarship",
      image: { asset: { _ref: "image-ref" }, alt: "Scholarship photo" },
      gallery: [{ asset: { _ref: "gallery-ref" }, alt: "Gallery photo" }],
      order: 1,
    },
  ];
  const { calls, client } = recordingClient(expected);

  const result = await getFoundationProjects("miles", client);

  assert.deepEqual(result, expected);
  assert.equal(calls.length, 1);
  assertPublishedTenantQuery(calls[0]!, "foundationProject");
  assertRequiredPublishedAtQuery(calls[0]!);
  assert.match(calls[0]!.query, /order\(order asc, date desc, _id asc\)/);
  assertFinalOrderTiebreaker(calls[0]!);
  assert.match(calls[0]!.query, /coalesce\(gallery/);
});

test("foundation events query returns only the requested tenant's published ordered records", async () => {
  const expected = [
    {
      _id: "foundation-event-1",
      title: "Gala",
      description: "Annual gala",
      date: "2026-10-01T18:00:00.000Z",
      location: "Downtown hall",
      registrationUrl: "/foundation",
      order: 1,
    },
  ];
  const { calls, client } = recordingClient(expected);

  const result = await getFoundationEvents("miles", client);

  assert.deepEqual(result, expected);
  assert.equal(calls.length, 1);
  assertPublishedTenantQuery(calls[0]!, "foundationEvent");
  assertRequiredPublishedAtQuery(calls[0]!);
  assert.match(calls[0]!.query, /order\(order asc, date asc, _id asc\)/);
  assertFinalOrderTiebreaker(calls[0]!);
  assert.match(calls[0]!.query, /registrationUrl/);
  assert.match(calls[0]!.query, /date >= now\(\)/);
});

test("foundation board members query returns only the requested tenant's published ordered records without a publishedAt gate", async () => {
  const expected = [
    {
      _id: "foundation-board-member-1",
      name: "Bro. Board Member",
      role: "Treasurer",
      bio: "Bio",
      portrait: { asset: { _ref: "portrait-ref" }, alt: "Board member portrait" },
      order: 1,
    },
  ];
  const { calls, client } = recordingClient(expected);

  const result = await getFoundationBoardMembers("miles", client);

  assert.deepEqual(result, expected);
  assert.equal(calls.length, 1);
  assertPublishedTenantQuery(calls[0]!, "foundationBoardMember");
  assert.doesNotMatch(calls[0]!.query, /publishedAt/);
  assert.match(calls[0]!.query, /order\(order asc, name asc, _id asc\)/);
  assertFinalOrderTiebreaker(calls[0]!);
  assert.match(calls[0]!.query, /portrait \{/);
});

test("program content queries return an empty list or null when Sanity is unavailable", async (context) => {
  context.mock.method(console, "error", () => undefined);
  const client = {
    async fetch<T>(): Promise<T> {
      throw new Error("Sanity unavailable");
    },
  };

  assert.equal(await getSigmaBetaSettings("root", client), null);
  assert.deepEqual(await getSigmaBetaEvents("root", client), []);
  assert.equal(await getFoundationSettings("root", client), null);
  assert.deepEqual(await getFoundationProjects("root", client), []);
  assert.deepEqual(await getFoundationEvents("root", client), []);
  assert.deepEqual(await getFoundationBoardMembers("root", client), []);
});
