import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Server Component / Server Action / Route Handler client, scoped to the
 * current user's session cookies. Anonymous/authenticated only — never use
 * this for privileged writes that must bypass RLS (see lib/supabase/admin.ts).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll called from a Server Component (no response to attach
            // cookies to) — safe to ignore as long as proxy.ts refreshes
            // the session on every request.
          }
        },
      },
    }
  );
}
