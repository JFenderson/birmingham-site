import { sanityClient } from "./client.ts";
import type {
  SanityGallerySummary,
  SanityImageWithAlt,
  SanityVideoSummary,
} from "./media.ts";
import {
  fetchPublishedCollection,
  fetchPublishedDocument,
  type SanityQueryClient,
} from "./query-helpers.ts";

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
  designation?: "currentExecutive" | "board" | null;
  order: number;
  portrait?: SanityImageWithAlt | null;
  bio?: string | null;
}

export interface SanityContentAction {
  href: string;
  label: string;
}

export interface SanityHomepageInitiative {
  title: string;
  description: string;
  link?: SanityContentAction | null;
  image?: SanityImageWithAlt | null;
}

export interface SanityHomepageSettings {
  _id: string;
  hero?: {
    eyebrow?: string | null;
    title?: string | null;
    description?: string | null;
    primaryAction?: SanityContentAction | null;
    secondaryAction?: SanityContentAction | null;
    image?: SanityImageWithAlt | null;
  } | null;
  communityImpact?: {
    eyebrow?: string | null;
    title?: string | null;
    description?: string | null;
    initiatives?: SanityHomepageInitiative[] | null;
  } | null;
  featuredPresident?: {
    eyebrow?: string | null;
    title?: string | null;
    description?: string | null;
    name?: string | null;
    role?: string | null;
    image?: SanityImageWithAlt | null;
    link?: SanityContentAction | null;
  } | null;
}

export interface SanityPastPresident {
  _id: string;
  name: string;
  yearsServed: string;
  order: number;
  featured: boolean;
  portrait: SanityImageWithAlt | null;
  bio: string | null;
}

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

export function getPublishedPostSummaries(
  chapterSlug: string,
  client: SanityQueryClient = sanityClient,
): Promise<SanityPostSummary[]> {
  return fetchPublishedCollection<SanityPostSummary>(
    `*[
      _type == "post" &&
      chapterSlug == $chapterSlug &&
      published == true &&
      defined(publishedAt) &&
      publishedAt <= now() &&
      !(_id in path("drafts.**"))
    ] | order(publishedAt desc, _id asc) {
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
  return fetchPublishedDocument<SanityPostDetail>(
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
    "post",
    client,
  );
}

export function getPublishedEvents(
  chapterSlug: string,
  client: SanityQueryClient = sanityClient,
): Promise<SanityEvent[]> {
  return fetchPublishedCollection<SanityEvent>(
    `*[
      _type == "event" &&
      chapterSlug == $chapterSlug &&
      published == true &&
      (!defined(publishedAt) || publishedAt <= now()) &&
      !(_id in path("drafts.**"))
    ] | order(order asc, publishedAt desc, _id asc) {
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
  return fetchPublishedCollection<SanityProgram>(
    `*[
      _type == "program" &&
      chapterSlug == $chapterSlug &&
      published == true &&
      !(_id in path("drafts.**"))
    ] | order(order asc, title asc, _id asc) {
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
  return fetchPublishedCollection<SanityLeader>(
    `*[
      _type == "leader" &&
      chapterSlug == $chapterSlug &&
      published == true &&
      !(_id in path("drafts.**"))
    ] | order(order asc, name asc, _id asc) {
      _id,
      name,
      role,
      designation,
      order,
      portrait {
        ...,
        alt
      },
      bio
    }`,
    chapterSlug,
    "leaders",
    client,
  );
}

export function getPublishedCurrentExecutiveLeaders(
  chapterSlug: string,
  client: SanityQueryClient = sanityClient,
): Promise<SanityLeader[]> {
  return fetchPublishedCollection<SanityLeader>(
    `*[
      _type == "leader" &&
      chapterSlug == $chapterSlug &&
      designation == "currentExecutive" &&
      published == true &&
      !(_id in path("drafts.**"))
    ] | order(order asc, name asc, _id asc) {
      _id,
      name,
      role,
      designation,
      order,
      portrait {
        ...,
        alt
      },
      bio
    }`,
    chapterSlug,
    "current executive leaders",
    client,
  );
}

export async function getPublishedHomepageSettings(
  chapterSlug: string,
  client: SanityQueryClient = sanityClient,
): Promise<SanityHomepageSettings | null> {
  return fetchPublishedDocument<SanityHomepageSettings>(
    `*[
      _type == "siteSettings" &&
      chapterSlug == $chapterSlug &&
      published == true &&
      defined(publishedAt) &&
      publishedAt <= now() &&
      !(_id in path("drafts.**"))
    ][0] {
      _id,
      chapterSlug,
      hero {
        eyebrow,
        title,
        description,
        primaryAction,
        secondaryAction,
        image {
          ...,
          alt
        }
      },
      communityImpact {
        eyebrow,
        title,
        description,
        initiatives[] {
          title,
          description,
          link,
          image {
            ...,
            alt
          }
        }
      },
      featuredPresident {
        eyebrow,
        title,
        description,
        name,
        role,
        image {
          ...,
          alt
        },
        link
      }
    }`,
    { chapterSlug },
    "homepage settings",
    client,
  );
}

export function getPublishedPastPresidents(
  chapterSlug: string,
  client: SanityQueryClient = sanityClient,
): Promise<SanityPastPresident[]> {
  return fetchPublishedCollection<SanityPastPresident>(
    `*[
      _type == "pastPresident" &&
      chapterSlug == $chapterSlug &&
      published == true &&
      defined(publishedAt) &&
      publishedAt <= now() &&
      !(_id in path("drafts.**"))
    ] | order(order asc, yearsServed desc, name asc, _id asc) {
      _id,
      name,
      yearsServed,
      order,
      featured,
      portrait {
        ...,
        alt
      },
      bio
    }`,
    chapterSlug,
    "past presidents",
    client,
  );
}

export function getPublishedGalleries(
  chapterSlug: string,
  client: SanityQueryClient = sanityClient,
): Promise<SanityGallerySummary[]> {
  return fetchPublishedCollection<SanityGallerySummary>(
    `*[
      _type == "gallery" &&
      chapterSlug == $chapterSlug &&
      published == true &&
      defined(publishedAt) &&
      publishedAt <= now() &&
      !(_id in path("drafts.**"))
    ] | order(eventDate desc, publishedAt desc, title asc, _id asc) {
      _id,
      title,
      "slug": slug.current,
      eventDate,
      publishedAt,
      description,
      coverImage {
        ...,
        alt
      },
      photos[] {
        ...,
        alt,
        caption
      }
    }`,
    chapterSlug,
    "galleries",
    client,
  );
}

export function getPublishedVideos(
  chapterSlug: string,
  client: SanityQueryClient = sanityClient,
): Promise<SanityVideoSummary[]> {
  return fetchPublishedCollection<SanityVideoSummary>(
    `*[
      _type == "video" &&
      chapterSlug == $chapterSlug &&
      published == true &&
      defined(publishedAt) &&
      publishedAt <= now() &&
      !(_id in path("drafts.**"))
    ] | order(publishedAt desc, title asc, _id asc) {
      _id,
      title,
      provider,
      url,
      publishedAt,
      description,
      thumbnail {
        ...,
        alt
      }
    }`,
    chapterSlug,
    "videos",
    client,
  );
}
