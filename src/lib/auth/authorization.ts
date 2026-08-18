import { getSession } from "./session";
import { getMemberForUser, type MemberContext } from "./member";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";

export const MEMBERSHIP_STATUSES = [
  "pending",
  "approved",
  "suspended",
] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const MEMBER_ACCESS_ROLES = [
  "member",
  "chapter_admin",
  "super_admin",
] as const;
export type MemberAccessRole = (typeof MEMBER_ACCESS_ROLES)[number];

export type AuthorizationErrorCode =
  | "UNAUTHENTICATED"
  | "PROFILE_NOT_FOUND"
  | "MEMBERSHIP_NOT_APPROVED"
  | "CHAPTER_SCOPE_MISMATCH"
  | "INSUFFICIENT_ROLE"
  | "MFA_REQUIRED";

export class AuthorizationError extends Error {
  constructor(
    public readonly code: AuthorizationErrorCode,
    message: string
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

interface AuthenticatedMemberResult {
  isAuthenticated: boolean;
  member: MemberContext | null;
}

async function resolveAuthenticatedMember(): Promise<AuthenticatedMemberResult> {
  const session = await getSession();
  if (!session) return { isAuthenticated: false, member: null };

  const member = await getMemberForUser(session.supabase, session.user);
  return { isAuthenticated: true, member };
}

/** Returns the current verified Auth user and profile, or null when absent. */
export async function getAuthenticatedMember(): Promise<MemberContext | null> {
  return (await resolveAuthenticatedMember()).member;
}

/**
 * Requires an approved profile scoped to the current tenant. Super admins are
 * global and therefore do not require a matching profile chapter.
 */
export async function requireApprovedMember(): Promise<MemberContext> {
  const { isAuthenticated, member } = await resolveAuthenticatedMember();

  if (!isAuthenticated) {
    throw new AuthorizationError("UNAUTHENTICATED", "Authentication required.");
  }

  if (!member) {
    throw new AuthorizationError(
      "PROFILE_NOT_FOUND",
      "An associated member profile is required."
    );
  }

  if (member.status !== "approved") {
    throw new AuthorizationError(
      "MEMBERSHIP_NOT_APPROVED",
      "Approved membership is required."
    );
  }

  if (member.role !== "super_admin") {
    const { chapterId } = await getTenantContext();
    if (!member.chapterId || member.chapterId !== chapterId) {
      throw new AuthorizationError(
        "CHAPTER_SCOPE_MISMATCH",
        "Membership does not grant access to this chapter."
      );
    }
  }

  return member;
}

/** Requires chapter-admin authority for the current tenant (or global admin). */
export async function requireChapterAdmin(): Promise<MemberContext> {
  const member = await requireApprovedMember();

  if (member.role !== "chapter_admin" && member.role !== "super_admin") {
    throw new AuthorizationError(
      "INSUFFICIENT_ROLE",
      "Chapter administrator access is required."
    );
  }

  const { data: aal } = await member.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") {
    throw new AuthorizationError("MFA_REQUIRED", "Multi-factor authentication is required.");
  }

  return member;
}

/** Requires an approved global super-admin profile. */
export async function requireSuperAdmin(): Promise<MemberContext> {
  const member = await requireApprovedMember();

  if (member.role !== "super_admin") {
    throw new AuthorizationError(
      "INSUFFICIENT_ROLE",
      "Super administrator access is required."
    );
  }

  const { data: aal } = await member.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") {
    throw new AuthorizationError("MFA_REQUIRED", "Multi-factor authentication is required.");
  }

  return member;
}
