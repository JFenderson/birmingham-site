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
  section?: "executiveBoard" | "committeeChairmen" | "fraternityLeadership" | null;
  fraternityLevel?: "state" | "regional" | "international" | null;
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
  gallery: Array<SanityImageWithAlt & { caption?: string | null }>;
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
      gallery[] {
        ...,
        alt,
        caption
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

export function getPublishedLeadershipPageLeaders(
  chapterSlug: string,
  client: SanityQueryClient = sanityClient,
): Promise<SanityLeader[]> {
  return fetchPublishedCollection<SanityLeader>(
    `*[
      _type == "leader" &&
      chapterSlug == $chapterSlug &&
      published == true &&
      !(_id in path("drafts.**"))
    ] | order(
      select(section == "executiveBoard" => 0, section == "committeeChairmen" => 1, section == "fraternityLeadership" => 2, 0) asc,
      select(fraternityLevel == "state" => 0, fraternityLevel == "regional" => 1, fraternityLevel == "international" => 2, 3) asc,
      order asc,
      name asc,
      _id asc
    ) {
      _id,
      name,
      role,
      designation,
      section,
      fraternityLevel,
      order,
      portrait {
        ...,
        alt
      },
      bio
    }`,
    chapterSlug,
    "leadership page leaders",
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
    ] | order(publishedAt desc, _updatedAt desc, _id asc)[0] {
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

export interface SanitySigmaBetaAdvisor {
  name: string;
  role: string;
  bio: string | null;
  portrait: SanityImageWithAlt | null;
}

export interface SanitySigmaBetaDirectorContact {
  label: string;
  email: string;
  phone: string | null;
}

export interface SanitySigmaBetaSettings {
  _id: string;
  chapterSlug: string;
  overview: string;
  mission: string;
  heroImage: SanityImageWithAlt | null;
  directorContact: SanitySigmaBetaDirectorContact | null;
  advisors: SanitySigmaBetaAdvisor[];
  interestFormIntro: string;
}

export interface SanitySigmaBetaEvent {
  _id: string;
  title: string;
  slug: string;
  description: string;
  eventDate: string;
  location: string;
  registrationUrl: string | null;
  image: SanityImageWithAlt | null;
  order: number;
}

export interface SanityFoundationSettings {
  _id: string;
  chapterSlug: string;
  nonprofitName: string;
  taxStatusStatement: string;
  purpose: string;
  overview: string;
  donationUrl: string;
  infoRequestIntro: string;
  contactEmail: string;
  heroImage: SanityImageWithAlt | null;
}

export interface SanityFoundationProject {
  _id: string;
  title: string;
  description: string;
  date: string;
  projectType: string;
  image: SanityImageWithAlt | null;
  gallery: SanityImageWithAlt[];
  order: number;
}

export interface SanityFoundationEvent {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  registrationUrl: string | null;
  order: number;
}

export interface SanityFoundationBoardMember {
  _id: string;
  name: string;
  role: string;
  bio: string | null;
  portrait: SanityImageWithAlt | null;
  order: number;
}

export async function getSigmaBetaSettings(
  chapterSlug: string,
  client: SanityQueryClient = sanityClient,
): Promise<SanitySigmaBetaSettings | null> {
  return fetchPublishedDocument<SanitySigmaBetaSettings>(
    `*[
      _type == "sigmaBetaSettings" &&
      chapterSlug == $chapterSlug &&
      published == true &&
      defined(publishedAt) &&
      publishedAt <= now() &&
      !(_id in path("drafts.**"))
    ] | order(publishedAt desc, _updatedAt desc, _id asc)[0] {
      _id,
      chapterSlug,
      overview,
      mission,
      heroImage {
        ...,
        alt
      },
      directorContact {
        label,
        email,
        phone
      },
      "advisors": coalesce(advisors[] {
        name,
        role,
        bio,
        portrait {
          ...,
          alt
        }
      }, []),
      interestFormIntro
    }`,
    { chapterSlug },
    "sigma beta settings",
    client,
  );
}

export function getSigmaBetaEvents(
  chapterSlug: string,
  client: SanityQueryClient = sanityClient,
): Promise<SanitySigmaBetaEvent[]> {
  return fetchPublishedCollection<SanitySigmaBetaEvent>(
    `*[
      _type == "sigmaBetaEvent" &&
      chapterSlug == $chapterSlug &&
      published == true &&
      defined(publishedAt) &&
      publishedAt <= now() &&
      eventDate >= now() &&
      !(_id in path("drafts.**"))
    ] | order(order asc, eventDate asc, _id asc) {
      _id,
      title,
      "slug": slug.current,
      description,
      eventDate,
      location,
      registrationUrl,
      image {
        ...,
        alt
      },
      order
    }`,
    chapterSlug,
    "sigma beta events",
    client,
  );
}

export async function getFoundationSettings(
  chapterSlug: string,
  client: SanityQueryClient = sanityClient,
): Promise<SanityFoundationSettings | null> {
  return fetchPublishedDocument<SanityFoundationSettings>(
    `*[
      _type == "foundationSettings" &&
      chapterSlug == $chapterSlug &&
      published == true &&
      defined(publishedAt) &&
      publishedAt <= now() &&
      !(_id in path("drafts.**"))
    ] | order(publishedAt desc, _updatedAt desc, _id asc)[0] {
      _id,
      chapterSlug,
      nonprofitName,
      taxStatusStatement,
      purpose,
      overview,
      donationUrl,
      infoRequestIntro,
      contactEmail,
      heroImage {
        ...,
        alt
      }
    }`,
    { chapterSlug },
    "foundation settings",
    client,
  );
}

export function getFoundationProjects(
  chapterSlug: string,
  client: SanityQueryClient = sanityClient,
): Promise<SanityFoundationProject[]> {
  return fetchPublishedCollection<SanityFoundationProject>(
    `*[
      _type == "foundationProject" &&
      chapterSlug == $chapterSlug &&
      published == true &&
      defined(publishedAt) &&
      publishedAt <= now() &&
      !(_id in path("drafts.**"))
    ] | order(order asc, date desc, _id asc) {
      _id,
      title,
      description,
      date,
      projectType,
      image {
        ...,
        alt
      },
      "gallery": coalesce(gallery[] {
        ...,
        alt
      }, []),
      order
    }`,
    chapterSlug,
    "foundation projects",
    client,
  );
}

export function getFoundationEvents(
  chapterSlug: string,
  client: SanityQueryClient = sanityClient,
): Promise<SanityFoundationEvent[]> {
  return fetchPublishedCollection<SanityFoundationEvent>(
    `*[
      _type == "foundationEvent" &&
      chapterSlug == $chapterSlug &&
      published == true &&
      defined(publishedAt) &&
      publishedAt <= now() &&
      date >= now() &&
      !(_id in path("drafts.**"))
    ] | order(order asc, date asc, _id asc) {
      _id,
      title,
      description,
      date,
      location,
      registrationUrl,
      order
    }`,
    chapterSlug,
    "foundation events",
    client,
  );
}

export function getFoundationBoardMembers(
  chapterSlug: string,
  client: SanityQueryClient = sanityClient,
): Promise<SanityFoundationBoardMember[]> {
  return fetchPublishedCollection<SanityFoundationBoardMember>(
    `*[
      _type == "foundationBoardMember" &&
      chapterSlug == $chapterSlug &&
      published == true &&
      !(_id in path("drafts.**"))
    ] | order(order asc, name asc, _id asc) {
      _id,
      name,
      role,
      bio,
      portrait {
        ...,
        alt
      },
      order
    }`,
    chapterSlug,
    "foundation board members",
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
