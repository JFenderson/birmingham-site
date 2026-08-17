export type SiteType = "graduate" | "collegiate";

export interface SiteBranding {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface SiteContext {
  chapterId: string;
  slug: string;
  name: string;
  siteType: SiteType;
  branding: SiteBranding;
}

interface ResolvedTenantInput {
  chapterId: string;
  chapterSlug: string;
}

interface ChapterRow {
  id: string;
  slug: string;
  name: string;
  type: string;
}

export const DEFAULT_SITE_BRANDING: Readonly<SiteBranding> = Object.freeze({
  logoUrl: null,
  primaryColor: "#0047AB",
  secondaryColor: "#FFFFFF",
  accentColor: "#003B8E",
});

export function getChapterMark(
  chapter: Pick<SiteContext, "name" | "siteType">,
): string {
  if (chapter.siteType === "graduate") return "ΤΣ";

  const words = chapter.name
    .trim()
    .split(/\s+/)
    .filter((word) => word.toLowerCase() !== "chapter");

  if (words.length >= 2) {
    return words
      .slice(0, 2)
      .map((word) => Array.from(word)[0] ?? "")
      .join("")
      .toLocaleUpperCase();
  }

  const name = words[0];
  return name
    ? Array.from(name).slice(0, 2).join("").toLocaleUpperCase()
    : "ΦΒΣ";
}

export function createSiteContext(
  tenant: ResolvedTenantInput,
  chapter: ChapterRow | null,
): SiteContext | null {
  if (
    !chapter ||
    chapter.id !== tenant.chapterId ||
    chapter.slug !== tenant.chapterSlug ||
    (chapter.type !== "graduate" && chapter.type !== "collegiate") ||
    !chapter.name.trim()
  ) {
    return null;
  }

  return {
    chapterId: chapter.id,
    slug: chapter.slug,
    name: chapter.name.trim(),
    siteType: chapter.type,
    branding: DEFAULT_SITE_BRANDING,
  };
}

export function createRootSiteFallback(
  tenant: ResolvedTenantInput,
): SiteContext | null {
  if (tenant.chapterSlug !== "root") return null;

  return {
    chapterId: tenant.chapterId,
    slug: "root",
    name: "Birmingham Sigmas",
    siteType: "graduate",
    branding: DEFAULT_SITE_BRANDING,
  };
}
