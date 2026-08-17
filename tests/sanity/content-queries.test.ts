import assert from "node:assert/strict";
import test from "node:test";

import {
  getPublishedEvents,
  getPublishedLeaders,
  getPublishedPrograms,
} from "../../src/sanity/queries.ts";

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
  documentType: "event" | "program" | "leader",
) {
  assert.match(call.query, new RegExp(`_type == "${documentType}"`));
  assert.match(call.query, /chapterSlug == \$chapterSlug/);
  assert.match(call.query, /published == true/);
  assert.match(call.query, /order\(order asc/);
  assert.doesNotMatch(call.query, /chapterSlug == "root"/);
  assert.deepEqual(call.params, { chapterSlug: "miles" });
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
});
