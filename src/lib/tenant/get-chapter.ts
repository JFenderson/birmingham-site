import { cache } from "react";
import { getTenantContext } from "./resolve-chapter";
import {
  createRootSiteFallback,
  createSiteContext,
  type SiteContext,
  type SiteType,
} from "./site-context";
import { createClient } from "@/lib/supabase/server";

export interface CurrentChapter extends SiteContext {
  chapterSlug: string;
  type: SiteType;
}

function withLegacyAliases(context: SiteContext): CurrentChapter {
  return {
    ...context,
    chapterSlug: context.slug,
    type: context.siteType,
  };
}

/**
 * Resolves the current request's chapter row, memoized per-request via
 * React's cache() so the public layout (header/footer) and the home page
 * can both call this without issuing duplicate Supabase queries.
 */
export const getCurrentChapter = cache(async (): Promise<CurrentChapter> => {
  const { chapterId, chapterSlug } = await getTenantContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("chapters")
    .select("id, slug, name, type")
    .eq("id", chapterId)
    .eq("slug", chapterSlug)
    .maybeSingle();

  const context =
    createSiteContext({ chapterId, chapterSlug }, data) ??
    createRootSiteFallback({ chapterId, chapterSlug });

  if (!context) {
    throw new Error("The resolved chapter is not configured for public access.");
  }

  return withLegacyAliases(context);
});
