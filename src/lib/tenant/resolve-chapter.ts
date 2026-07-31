import { headers } from "next/headers";
import { loadChapterSlugMap, ROOT_SLUG } from "./constants";
import type { TenantContext } from "@/types/domain";

export const TENANT_ID_HEADER = "x-chapter-id";
export const TENANT_SLUG_HEADER = "x-chapter-slug";

/**
 * Pure hostname -> { slug, chapterId } resolution, used inside proxy.ts.
 * Kept dependency-free (no next/headers, no DB calls) since proxy.ts runs
 * ahead of the render pipeline and should stay cheap/deterministic.
 */
export function resolveTenantFromRequest(
  host: string | null,
  searchParams: URLSearchParams
): TenantContext | null {
  const rootDomain = process.env.ROOT_DOMAIN ?? "";
  const slugMap = loadChapterSlugMap();

  // Dev/CI override, only outside production.
  if (process.env.NODE_ENV !== "production") {
    const override = searchParams.get("__tenant");
    if (override) {
      const chapterId = slugMap[override];
      if (chapterId) return { chapterId, chapterSlug: override };
    }
  }

  const hostname = (host ?? "").split(":")[0]?.toLowerCase() ?? "";
  if (!hostname) return null;

  let slug: string;
  if (!rootDomain) {
    // No ROOT_DOMAIN configured (e.g. Vercel preview *.vercel.app) — fall
    // back to the root tenant rather than guessing at a subdomain.
    slug = ROOT_SLUG;
  } else if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
    slug = ROOT_SLUG;
  } else if (hostname.endsWith(`.${rootDomain}`)) {
    slug = hostname.slice(0, hostname.length - rootDomain.length - 1);
  } else {
    // Unrecognized host (e.g. a Vercel preview URL) — default to root.
    slug = ROOT_SLUG;
  }

  const chapterId = slugMap[slug];
  if (!chapterId) return null;

  return { chapterId, chapterSlug: slug };
}

/**
 * Server Component / Server Action read path for tenant context resolved by
 * proxy.ts. This is the single source of truth downstream — application
 * code should never re-derive tenant from request.url directly.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const headerList = await headers();
  const chapterId = headerList.get(TENANT_ID_HEADER);
  const chapterSlug = headerList.get(TENANT_SLUG_HEADER);

  if (!chapterId || !chapterSlug) {
    throw new Error(
      "Tenant context missing — proxy.ts did not resolve a chapter for this request."
    );
  }

  return { chapterId, chapterSlug };
}
