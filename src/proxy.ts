import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  resolveTenantFromRequest,
  TENANT_ID_HEADER,
  TENANT_SLUG_HEADER,
} from "@/lib/tenant/resolve-chapter";

const PORTAL_PREFIXES = ["/dashboard", "/admin"];

export async function proxy(request: NextRequest) {
  const tenant = resolveTenantFromRequest(
    request.headers.get("host"),
    request.nextUrl.searchParams
  );

  if (!tenant) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(TENANT_ID_HEADER, tenant.chapterId);
  requestHeaders.set(TENANT_SLUG_HEADER, tenant.chapterSlug);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  // Session refresh runs unconditionally (required by @supabase/ssr to keep
  // tokens alive), independent of tenant resolution above — public pages
  // still need correct tenant context without requiring a login.
  const { user } = await updateSession(request, response);

  const isPortalRoute = PORTAL_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  // UX-only shortcut, not the security boundary — requireRole() inside each
  // Server Action/page is what actually enforces access.
  if (isPortalRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    // Preserve any Set-Cookie headers written by updateSession's refresh.
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    response = redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
