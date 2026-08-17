import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { MemberAccessRole, MembershipStatus } from "./authorization";

type ServerSupabaseClient = SupabaseClient<Database>;

const MEMBERSHIP_STATUSES: ReadonlySet<string> = new Set([
  "pending",
  "approved",
  "suspended",
]);

const MEMBER_ACCESS_ROLES: ReadonlySet<string> = new Set([
  "member",
  "chapter_admin",
  "super_admin",
]);

export interface MemberProfile {
  id: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  chapterId: string | null;
  membershipStatus: MembershipStatus;
  role: MemberAccessRole;
  approvedAt: string | null;
  approvedBy: string | null;
}

export interface MemberContext {
  user: User;
  profile: MemberProfile;
  chapterId: string | null;
  status: MembershipStatus;
  role: MemberAccessRole;
  supabase: ServerSupabaseClient;
}

export class MemberProfileLookupError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MemberProfileLookupError";
  }
}

function isMembershipStatus(value: string): value is MembershipStatus {
  return MEMBERSHIP_STATUSES.has(value);
}

function isMemberAccessRole(value: string): value is MemberAccessRole {
  return MEMBER_ACCESS_ROLES.has(value);
}

/**
 * Loads only the signed-in user's profile through the request-scoped SSR
 * client. RLS remains in force; malformed authorization values fail closed.
 */
export async function getMemberForUser(
  supabase: ServerSupabaseClient,
  user: User
): Promise<MemberContext | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, phone, avatar_url, chapter_id, membership_status, role, approved_at, approved_by"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new MemberProfileLookupError("Unable to load the member profile.", {
      cause: error,
    });
  }

  if (!profile) return null;

  if (
    !isMembershipStatus(profile.membership_status) ||
    !isMemberAccessRole(profile.role)
  ) {
    throw new MemberProfileLookupError(
      "The member profile contains an unsupported authorization value."
    );
  }

  const memberProfile: MemberProfile = {
    id: profile.id,
    fullName: profile.full_name,
    phone: profile.phone,
    avatarUrl: profile.avatar_url,
    chapterId: profile.chapter_id,
    membershipStatus: profile.membership_status,
    role: profile.role,
    approvedAt: profile.approved_at,
    approvedBy: profile.approved_by,
  };

  return {
    user,
    profile: memberProfile,
    chapterId: memberProfile.chapterId,
    status: memberProfile.membershipStatus,
    role: memberProfile.role,
    supabase,
  };
}
