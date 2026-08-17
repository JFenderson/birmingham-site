import { sanityClient } from "./client.ts";

export interface SanityEvent {
  _id: string;
  title: string;
  description: string;
  order: number;
  publishedAt: string | null;
}

export interface SanityProgram {
  _id: string;
  title: string;
  description: string;
  order: number;
}

export interface SanityLeader {
  _id: string;
  name: string;
  role: string;
  order: number;
}

interface SanityQueryClient {
  fetch<T>(query: string, params: Record<string, unknown>): Promise<T>;
}

async function fetchPublishedContent<T>(
  query: string,
  chapterSlug: string,
  contentType: string,
  client: SanityQueryClient,
): Promise<T[]> {
  try {
    return await client.fetch<T[]>(query, { chapterSlug });
  } catch (error) {
    console.error(`[sanity] failed to fetch published ${contentType}`, error);
    return [];
  }
}

export function getPublishedEvents(
  chapterSlug: string,
  client: SanityQueryClient = sanityClient,
): Promise<SanityEvent[]> {
  return fetchPublishedContent<SanityEvent>(
    `*[
      _type == "event" &&
      chapterSlug == $chapterSlug &&
      published == true &&
      (!defined(publishedAt) || publishedAt <= now())
    ] | order(order asc, publishedAt desc) {
      _id,
      title,
      description,
      order,
      publishedAt
    }`,
    chapterSlug,
    "events",
    client,
  );
}

export function getPublishedPrograms(
  chapterSlug: string,
  client: SanityQueryClient = sanityClient,
): Promise<SanityProgram[]> {
  return fetchPublishedContent<SanityProgram>(
    `*[
      _type == "program" &&
      chapterSlug == $chapterSlug &&
      published == true
    ] | order(order asc, title asc) {
      _id,
      title,
      description,
      order
    }`,
    chapterSlug,
    "programs",
    client,
  );
}

export function getPublishedLeaders(
  chapterSlug: string,
  client: SanityQueryClient = sanityClient,
): Promise<SanityLeader[]> {
  return fetchPublishedContent<SanityLeader>(
    `*[
      _type == "leader" &&
      chapterSlug == $chapterSlug &&
      published == true
    ] | order(order asc, name asc) {
      _id,
      name,
      role,
      order
    }`,
    chapterSlug,
    "leaders",
    client,
  );
}
