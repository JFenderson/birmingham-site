import { createAdminClient } from "../supabase/admin.ts";
import { ROOT_SLUG } from "../tenant/constants.ts";

export type VerifyRootRosterMemberInput = {
  membershipNumber: string;
  lastName: string;
};

export type VerifyRootRosterMemberResult = {
  matched: boolean;
  rosterId?: string;
};

export const rootRosterVerificationDependencies = {
  createAdminClient,
};

function normalizeMembershipNumber(value: string): string | null {
  const normalized = value.trim().replace(/\s+/g, "").toUpperCase();
  if (!normalized || normalized.length > 64) return null;
  return normalized;
}

function normalizeLastName(value: string): string | null {
  const normalized = value.trim().replace(/\s+/g, " ").toLowerCase();
  if (!normalized || normalized.length > 120) return null;
  return normalized;
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

/**
 * Narrow server-side root roster lookup. Callers receive only a neutral match
 * result so public access flows cannot enumerate names, emails, status, or
 * whether a membership number exists but has already been claimed.
 */
export async function verifyRootRosterMember(
  input: VerifyRootRosterMemberInput,
): Promise<VerifyRootRosterMemberResult> {
  const membershipNumber = normalizeMembershipNumber(input.membershipNumber);
  const lastName = normalizeLastName(input.lastName);
  if (!membershipNumber || !lastName) return { matched: false };

  const admin = rootRosterVerificationDependencies.createAdminClient();
  const { data, error } = await admin
    .from("root_member_roster")
    .select("id, claimed_profile_id, chapters!inner(slug)")
    .eq("membership_number_normalized", membershipNumber)
    .eq("last_name_normalized", lastName)
    .eq("chapters.slug", ROOT_SLUG)
    .eq("status", "active")
    .is("claimed_profile_id", null)
    .maybeSingle();

  if (error) {
    console.error("[roster] Root member verification lookup failed.", {
      code: getErrorCode(error),
    });
    return { matched: false };
  }

  if (!data || data.claimed_profile_id) {
    return { matched: false };
  }

  return { matched: true, rosterId: data.id };
}
