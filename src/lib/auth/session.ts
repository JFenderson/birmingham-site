import { createClient } from "@/lib/supabase/server";

/**
 * Re-validates the JWT against the Supabase Auth server on every call via
 * getUser() — never getSession(), which only reads the (potentially stale
 * or tampered) local cookie copy. This is the zero-trust foundation every
 * requireRole() check builds on.
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return { user, supabase };
}
