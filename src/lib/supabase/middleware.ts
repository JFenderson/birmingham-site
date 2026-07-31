import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

/**
 * Refreshes the Supabase auth session cookie inside proxy.ts and reports
 * whether a valid user is present. This is the UX-only auth gate — the real
 * security boundary is requireRole() inside each Server Action/page.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse
) {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // getUser() re-validates the JWT against the Supabase Auth server rather
  // than trusting the locally-stored cookie — required for the zero-trust
  // auth gate even at this UX-shortcut layer.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user };
}
