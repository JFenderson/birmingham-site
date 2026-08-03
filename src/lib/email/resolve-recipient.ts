import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Looks up a profile's display name and auth email for best-effort
 * notification sends. Returns null when the auth user has no email on
 * file (recipient resolution failed, not a hard error) so callers can
 * count a skip instead of throwing.
 */
export async function resolveRecipient(
  admin: AdminClient,
  profileId: string
): Promise<{ email: string; name: string } | null> {
  const [{ data: profile }, { data: userData }] = await Promise.all([
    admin.from("profiles").select("full_name").eq("id", profileId).maybeSingle(),
    admin.auth.admin.getUserById(profileId),
  ]);
  const email = userData.user?.email;
  if (!email) return null;
  return { email, name: profile?.full_name ?? "there" };
}
