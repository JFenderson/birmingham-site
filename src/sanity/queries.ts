import { sanityClient } from "./client.ts";
import type { SanityImageSource } from "@sanity/image-url";

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

export type SanityImageWithAlt = SanityImageSource & {
  alt?: string | null;
};

export interface SanityPostSummary {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  coverImage: SanityImageWithAlt | null;
  excerpt: string | null;
}

export interface SanityPostDetail {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  coverImage: SanityImageWithAlt | null;
  body: unknown;
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

export function getPublishedPostSummaries(
  chapterSlug: string,
  client: SanityQueryClient = sanityClient,
): Promise<SanityPostSummary[]> {
  return fetchPublishedContent<SanityPostSummary>(
    `*[
      _type == "post" &&
      chapterSlug == $chapterSlug &&
      published == true &&
      defined(publishedAt) &&
      publishedAt <= now() &&
      !(_id in path("drafts.**"))
    ] | order(publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      coverImage {
        ...,
        alt
      },
      excerpt
    }`,
    chapterSlug,
    "posts",
    client,
  );
}

export async function getPublishedPostBySlug(
  chapterSlug: string,
  slug: string,
  client: SanityQueryClient = sanityClient,
): Promise<SanityPostDetail | null> {
  try {
    return await client.fetch<SanityPostDetail | null>(
      `*[
        _type == "post" &&
        chapterSlug == $chapterSlug &&
        slug.current == $slug &&
        published == true &&
        defined(publishedAt) &&
        publishedAt <= now() &&
        !(_id in path("drafts.**"))
      ][0] {
        _id,
        title,
        "slug": slug.current,
        publishedAt,
        coverImage {
          ...,
          alt
        },
        body
      }`,
      { chapterSlug, slug },
    );
  } catch (error) {
    console.error("[sanity] failed to fetch published post", error);
    return null;
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
