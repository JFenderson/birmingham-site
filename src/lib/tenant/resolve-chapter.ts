import { headers } from "next/headers";
import { loadChapterSlugMap } from "./constants";
import { resolveTenant } from "./resolve-tenant";
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
  return resolveTenant(host, searchParams, {
    nodeEnv: process.env.NODE_ENV,
    rootDomain: process.env.ROOT_DOMAIN ?? "",
    slugMap: loadChapterSlugMap(),
  });
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
