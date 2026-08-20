import { defineField } from "sanity";
import { isSafeContentActionHref, isSafeExternalUrl } from "../../lib/content-links.ts";

type ChapterOptionsEnv = {
  CHAPTER_SLUG_MAP?: string | undefined;
};

type ImageValue = {
  asset?: { _ref?: string };
  alt?: string;
} | null;

type VideoValue = {
  provider?: string;
  url?: string;
} | null;

function startCaseSlug(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseConfiguredChapterSlugs(
  env: ChapterOptionsEnv = process.env as ChapterOptionsEnv,
): string[] {
  const raw = env.CHAPTER_SLUG_MAP;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return [];

    return Object.keys(parsed)
      .filter((slug) => slug !== "root")
      .sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
}

export function getChapterSlugOptions(
  env: ChapterOptionsEnv = process.env as ChapterOptionsEnv,
) {
  const slugs = ["root", ...parseConfiguredChapterSlugs(env)];

  return slugs.map((slug) => ({
    title: slug === "root" ? "Root chapter (root)" : `${startCaseSlug(slug)} chapter (${slug})`,
    value: slug,
  }));
}

export function createChapterSlugField(documentLabel: string) {
  const options = getChapterSlugOptions();
  const allowedSlugs = new Set(options.map((option) => option.value));

  return defineField({
    name: "chapterSlug",
    title: "Chapter",
    type: "string",
    description: `Choose which chapter site should show this ${documentLabel}. Root is the main site; collegiate chapters come from CHAPTER_SLUG_MAP.`,
    options: { list: options },
    validation: (rule) =>
      rule.required().custom((value) => {
        if (typeof value !== "string" || value.trim().length === 0) {
          return "Choose the chapter that owns this document.";
        }

        return allowedSlugs.has(value)
          ? true
          : "Choose one of the configured chapter slugs.";
      }),
  });
}

export function createPublishedField(documentLabel: string) {
  return defineField({
    name: "published",
    title: "Publicly visible",
    type: "boolean",
    initialValue: false,
    description: `Turn this on only when the ${documentLabel} is ready for the public site.`,
    validation: (rule) => rule.required(),
  });
}

export function createPublishedAtField(documentLabel: string) {
  return defineField({
    name: "publishedAt",
    title: "Publication date",
    type: "datetime",
    description: `Set when the ${documentLabel} should appear publicly. Keep this blank while drafting.`,
    validation: (rule) =>
      rule.custom((value, context) => {
        const parent = context.parent as { published?: boolean } | undefined;

        if (parent?.published && !value) {
          return "Add a publication date before publishing.";
        }

        return true;
      }),
  });
}

export function createAccessibleImageField(
  name: string,
  title: string,
  description: string,
  options?: { required?: boolean },
) {
  const isRequired = options?.required ?? false;

  return defineField({
    name,
    title,
    type: "image",
    options: { hotspot: true },
    description,
    fields: [
      defineField({
        name: "alt",
        title: "Alt text",
        type: "string",
        description: "Describe the image for people using assistive technology.",
        validation: (rule) =>
          rule.custom((value, context) => {
            const parent = context.parent as ImageValue;
            const hasAsset = Boolean(parent?.asset?._ref);

            if (!hasAsset) return true;
            if (typeof value === "string" && value.trim().length > 0) return true;

            return "Alt text is required for every public image.";
          }),
      }),
    ],
    validation: (rule) =>
      rule.custom((value) => {
        const image = value as ImageValue;
        const hasAsset = Boolean(image?.asset?._ref);
        const hasAlt = typeof image?.alt === "string" && image.alt.trim().length > 0;

        if (isRequired && !hasAsset) {
          return `${title} is required.`;
        }

        if (hasAsset && !hasAlt) {
          return "Alt text is required for every public image.";
        }

        return true;
      }),
  });
}

export function createContentActionHrefField() {
  return defineField({
    name: "href",
    title: "Link URL",
    type: "string",
    description: "Use a site path such as /about or an approved HTTPS URL.",
    validation: (rule) =>
      rule.required().custom((value) => {
        if (typeof value !== "string" || value.trim().length === 0) {
          return "Add a link URL.";
        }

        return isSafeContentActionHref(value)
          ? true
          : "Use a safe internal path beginning with / or an approved HTTPS URL.";
      }),
  });
}

/**
 * A safe-URL field for destinations that are not part of the approved
 * external content-action host allowlist (for example donation processors
 * or third-party event registration forms). Accepts an internal path
 * beginning with "/" or any HTTPS URL; rejects other schemes,
 * protocol-relative "//" URLs, and control characters. Does not modify or
 * extend `isSafeContentActionHref`, which remains scoped to the approved
 * partner host allowlist.
 */
export function createSafeExternalUrlField(
  name: string,
  title: string,
  description: string,
  options?: { required?: boolean },
) {
  const isRequired = options?.required ?? false;

  return defineField({
    name,
    title,
    type: "string",
    description,
    validation: (rule) => {
      const base = isRequired ? rule.required() : rule;

      return base.custom((value) => {
        if (typeof value !== "string" || value.trim().length === 0) {
          return isRequired ? `Add a ${title.toLowerCase()}.` : true;
        }

        return isSafeExternalUrl(value)
          ? true
          : "Use a safe internal path beginning with / or an HTTPS URL.";
      });
    },
  });
}

export function createVideoUrlField() {
  return defineField({
    name: "url",
    title: "Video URL",
    type: "url",
    description: "Paste a public YouTube or Vimeo link for this video.",
    validation: (rule) =>
      rule.required().uri({ scheme: ["https"] }).custom((value, context) => {
        if (typeof value !== "string") {
          return "Add a video URL.";
        }

        let hostname = "";
        try {
          hostname = new URL(value).hostname.toLowerCase();
        } catch {
          return "Enter a valid HTTPS URL.";
        }

        const provider = (context.parent as VideoValue | undefined)?.provider;
        const matchesYouTube =
          hostname === "youtube.com" ||
          hostname === "www.youtube.com" ||
          hostname === "youtu.be";
        const matchesVimeo = hostname === "vimeo.com" || hostname === "www.vimeo.com";

        if (!matchesYouTube && !matchesVimeo) {
          return "Only YouTube and Vimeo links are allowed.";
        }

        if (provider === "youtube" && !matchesYouTube) {
          return "Choose YouTube or use a YouTube URL.";
        }

        if (provider === "vimeo" && !matchesVimeo) {
          return "Choose Vimeo or use a Vimeo URL.";
        }

        return true;
      }),
  });
}
