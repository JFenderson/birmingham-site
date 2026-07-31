import { getSession } from "./session";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { MFA_REQUIRED_ROLES, type MemberRole } from "@/types/domain";

export class PermissionError extends Error {}

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

  if (!membership || !allowed.includes(membership.role as MemberRole)) {
    throw new PermissionError("Insufficient role");
  }

  const role = membership.role as MemberRole;

  if (MFA_REQUIRED_ROLES.includes(role)) {
    const { data: aal } =
      await session.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") {
      throw new PermissionError("MFA required");
    }
  }

  return { user: session.user, role, chapterId, supabase: session.supabase };
}
