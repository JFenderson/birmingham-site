import { getSession } from "./session";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { MFA_REQUIRED_ROLES, type MemberRole } from "@/types/domain";

export class PermissionError extends Error {}
export class MfaRequiredError extends Error {}

/**
 * Zero-trust role check. Call this as the FIRST line of every sensitive
 * Server Action / Route Handler — never rely on the UI having hidden a
 * button. Re-validates the session, the caller's role within the current
 * request's chapter, and (for roles that require it) MFA assurance level,
 * on every single invocation.
 */
export async function requireRole(allowed: readonly MemberRole[]) {
  const session = await getSession();
  if (!session) throw new PermissionError("Not authenticated");

  const { chapterId } = await getTenantContext();

  const { data: membership } = await session.supabase
    .from("chapter_members")
    .select("role")
    .eq("profile_id", session.user.id)
    .eq("chapter_id", chapterId)
    .eq("is_deleted", false)
    .maybeSingle();

  let role = membership?.role as MemberRole | undefined;

  if (!role) {
    const { data: profile } = await session.supabase
      .from("profiles")
      .select("chapter_id, membership_status, role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (
      profile?.membership_status === "approved" &&
      (profile.role === "member" || profile.role === "chapter_admin" || profile.role === "super_admin") &&
      (profile.role === "super_admin" || profile.chapter_id === chapterId)
    ) {
      role = profile.role === "member" ? "Member" : "Admin";
    }
  }

  if (!role || !allowed.includes(role)) {
    throw new PermissionError("Insufficient role");
  }

  if (MFA_REQUIRED_ROLES.includes(role)) {
    const { data: aal } =
      await session.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") {
      throw new MfaRequiredError();
    }
  }

  return { user: session.user, role, chapterId, supabase: session.supabase };
}
