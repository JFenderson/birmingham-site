export const ROOT_SLUG = "root";

/**
 * Static slug -> chapter_id map, sourced from the CHAPTER_SLUG_MAP env var
 * (a JSON object). Kept out of the request path's DB round-trip since this
 * changes rarely (root chapter + 5 advised collegiate chapters).
 *
 * Regenerate CHAPTER_SLUG_MAP after seeding/editing the `chapters` table:
 *   {"root":"<uuid>","miles":"<uuid>","talladega":"<uuid>",...}
 */
export function loadChapterSlugMap(): Record<string, string> {
  const raw = process.env.CHAPTER_SLUG_MAP;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}
