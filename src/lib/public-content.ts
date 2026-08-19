import type {
  SanityContentAction,
  SanityHomepageInitiative,
  SanityHomepageSettings,
  SanityLeader,
  SanityPastPresident,
} from "../sanity/queries.ts";
import type { SanityImageWithAlt } from "../sanity/media.ts";

export interface HomepageContent {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryAction: SanityContentAction;
    secondaryAction: SanityContentAction;
    image: SanityImageWithAlt | null;
  };
  communityImpact: {
    eyebrow: string;
    title: string;
    description: string;
    initiatives: SanityHomepageInitiative[];
  };
  featuredPresident: {
    eyebrow: string;
    title: string;
    description: string;
    name: string;
    role: string;
    image: SanityImageWithAlt | null;
    link: SanityContentAction;
  };
}

interface EmptyPastPresidentsContent {
  status: "empty";
  notes: string[];
}

interface PopulatedPastPresidentsContent {
  status: "populated";
  presidents: SanityPastPresident[];
}

const DEFAULT_INITIATIVES: SanityHomepageInitiative[] = [
  {
    title: "BHM Blue and White Weekend",
    description: "A signature chapter gathering that brings fellowship, legacy, and service together in Birmingham.",
    link: { href: "/community-events", label: "Explore the initiative" },
  },
  {
    title: "Shoes for Kids",
    description: "Annual outreach that helps students begin the school year with confidence and support.",
    link: { href: "/community-events", label: "Explore the initiative" },
  },
  {
    title: "Toys for Kids",
    description: "Holiday service that partners with local families and organizations to share joy and resources.",
    link: { href: "/community-events", label: "Explore the initiative" },
  },
];

const DEFAULT_LEADERSHIP: SanityLeader[] = [
  {
    _id: "fallback-president",
    name: "Bro. Joseph Fenderson",
    role: "Chapter President",
    designation: "currentExecutive",
    order: 0,
    portrait: null,
    bio: null,
  },
  {
    _id: "fallback-board",
    name: "Tau Sigma Executive Board",
    role: "Chapter Leadership Team",
    designation: "currentExecutive",
    order: 1,
    portrait: null,
    bio: null,
  },
];

const PAST_PRESIDENT_FALLBACK_NOTES = [
  "Historical chapter records are being digitized for this section.",
  "Please check back soon for a full list of past chapter presidents.",
];

function textOrFallback(value: string | null | undefined, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function actionOrFallback(
  value: SanityContentAction | null | undefined,
  fallback: SanityContentAction,
): SanityContentAction {
  if (
    typeof value?.href === "string" &&
    value.href.trim().length > 0 &&
    typeof value.label === "string" &&
    value.label.trim().length > 0
  ) {
    return { href: value.href.trim(), label: value.label.trim() };
  }

  return fallback;
}

export function getSafeImageAlt(image: SanityImageWithAlt | null | undefined): string | null {
  const alt = image?.alt?.trim();

  return alt && alt.length > 0 ? alt : null;
}

export function resolveHomepageContent(
  chapterName: string,
  settings: SanityHomepageSettings | null,
): HomepageContent {
  const fallback: HomepageContent = {
    hero: {
      eyebrow: "Birmingham Sigmas · Phi Beta Sigma Fraternity, Inc.",
      title: chapterName,
      description: "Serving Birmingham and Jefferson County through brotherhood, scholarship, and service for humanity.",
      primaryAction: { href: "/about", label: "Discover our chapter" },
      secondaryAction: { href: "/contact", label: "Connect with us" },
      image: null,
    },
    communityImpact: {
      eyebrow: "Community impact",
      title: "Service that meets Birmingham where it is",
      description:
        "Our signature initiatives create moments of support, celebration, and opportunity for students, families, and neighbors throughout the year.",
      initiatives: DEFAULT_INITIATIVES,
    },
    featuredPresident: {
      eyebrow: "From the president",
      title: "Service-driven leadership, rooted in brotherhood",
      description:
        "Tau Sigma leadership is committed to thoughtful planning, chapter accountability, member development, and service that reaches beyond our meetings.",
      name: "Bro. Joseph Fenderson",
      role: "Chapter President",
      image: null,
      link: { href: "/photos", label: "View chapter moments" },
    },
  };

  if (!settings) return fallback;

  return {
    hero: {
      eyebrow: textOrFallback(settings.hero?.eyebrow, fallback.hero.eyebrow),
      title: textOrFallback(settings.hero?.title, fallback.hero.title),
      description: textOrFallback(settings.hero?.description, fallback.hero.description),
      primaryAction: actionOrFallback(settings.hero?.primaryAction, fallback.hero.primaryAction),
      secondaryAction: actionOrFallback(settings.hero?.secondaryAction, fallback.hero.secondaryAction),
      image: settings.hero?.image ?? null,
    },
    communityImpact: {
      eyebrow: textOrFallback(settings.communityImpact?.eyebrow, fallback.communityImpact.eyebrow),
      title: textOrFallback(settings.communityImpact?.title, fallback.communityImpact.title),
      description: textOrFallback(settings.communityImpact?.description, fallback.communityImpact.description),
      initiatives:
        settings.communityImpact?.initiatives && settings.communityImpact.initiatives.length > 0
          ? settings.communityImpact.initiatives
          : fallback.communityImpact.initiatives,
    },
    featuredPresident: {
      eyebrow: textOrFallback(settings.featuredPresident?.eyebrow, fallback.featuredPresident.eyebrow),
      title: textOrFallback(settings.featuredPresident?.title, fallback.featuredPresident.title),
      description: textOrFallback(settings.featuredPresident?.description, fallback.featuredPresident.description),
      name: textOrFallback(settings.featuredPresident?.name, fallback.featuredPresident.name),
      role: textOrFallback(settings.featuredPresident?.role, fallback.featuredPresident.role),
      image: settings.featuredPresident?.image ?? null,
      link: actionOrFallback(settings.featuredPresident?.link, fallback.featuredPresident.link),
    },
  };
}

export function resolveLeadershipContent(leaders: SanityLeader[]): SanityLeader[] {
  return leaders.length > 0 ? leaders : DEFAULT_LEADERSHIP;
}

export function resolvePastPresidentsContent(
  presidents: SanityPastPresident[],
): EmptyPastPresidentsContent | PopulatedPastPresidentsContent {
  if (presidents.length === 0) {
    return {
      status: "empty",
      notes: PAST_PRESIDENT_FALLBACK_NOTES,
    };
  }

  return {
    status: "populated",
    presidents,
  };
}
