import { cache } from "react";
import { getTenantContext } from "./resolve-chapter";
import { createClient } from "@/lib/supabase/server";

export interface CurrentChapter {
  chapterId: string;
  chapterSlug: string;
  name: string;
  type: "graduate" | "collegiate";
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
    .select("name, type")
    .eq("id", chapterId)
    .maybeSingle();

  return {
    chapterId,
    chapterSlug,
    name: data?.name ?? chapterSlug,
    type: (data?.type as "graduate" | "collegiate" | undefined) ?? "collegiate",
  };
});
