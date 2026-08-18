import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function resolveSafeNext(rawNext: string, requestUrl: string): string {
  try {
    const resolved = new URL(rawNext, requestUrl);
    const base = new URL(requestUrl);
    if (resolved.origin === base.origin) {
      return resolved.pathname + resolved.search;
    }
  } catch {
    // fall through to the safe default below
  }
  return "/accept-invite";
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const defaultNext = type === "recovery" ? "/reset-password" : "/accept-invite";
  const rawNext = request.nextUrl.searchParams.get("next") ?? defaultNext;
  const next = resolveSafeNext(rawNext, request.url);

  if (!tokenHash || (type !== "invite" && type !== "recovery")) {
    return NextResponse.redirect(new URL("/login?error=invite-expired", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: type === "recovery" ? "recovery" : "invite",
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.redirect(new URL("/login?error=invite-expired", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
