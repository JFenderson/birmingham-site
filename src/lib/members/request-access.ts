import { verifyRootRosterMember } from "@/lib/roster/verify-root-member";
import { createAdminClient } from "@/lib/supabase/admin";

export type RequestRootMemberAccessInput = {
  chapterId: string;
  membershipNumber: string;
  lastName: string;
  fullName: string;
  email: string;
  redirectTo: string;
};

export type RequestRootMemberAccessResult = {
  created: boolean;
};

type AdminClient = ReturnType<typeof createAdminClient>;

export const requestAccessDependencies = {
  createAdminClient,
  verifyRootRosterMember,
};

function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function getErrorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null || !("message" in error)) {
    return "";
  }

  const message = (error as { message?: unknown }).message;
  return typeof message === "string" ? message.toLowerCase() : "";
}

function isDuplicateAuthEmail(error: unknown): boolean {
  const code = getErrorCode(error);
  const message = getErrorMessage(error);
  return (
    code === "email_exists" ||
    message.includes("already been registered") ||
    message.includes("already exists")
  );
}

async function deleteInvitedUser(admin: AdminClient, userId: string) {
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("[request-access] Could not clean up unclaimed invited user.", {
      code: getErrorCode(error),
      userId,
    });
  }
}

export async function requestRootMemberAccess(
  input: RequestRootMemberAccessInput,
): Promise<RequestRootMemberAccessResult> {
  const rosterMatch = await requestAccessDependencies.verifyRootRosterMember({
    membershipNumber: input.membershipNumber,
    lastName: input.lastName,
  });

  if (!rosterMatch.matched || !rosterMatch.rosterId) {
    return { created: false };
  }

  const admin = requestAccessDependencies.createAdminClient();
  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(input.email, {
      data: {
        full_name: input.fullName,
        requested_chapter_id: input.chapterId,
        root_roster_id: rosterMatch.rosterId,
      },
      redirectTo: input.redirectTo,
    });

  if (inviteError || !inviteData?.user) {
    if (!isDuplicateAuthEmail(inviteError)) {
      console.error("[request-access] Auth invite failed.", {
        code: getErrorCode(inviteError),
      });
    }
    return { created: false };
  }

  const userId = inviteData.user.id;
  const { data: claimCreated, error: claimError } = await admin.rpc(
    "claim_root_member_access_request",
    {
      p_chapter_id: input.chapterId,
      p_full_name: input.fullName,
      p_profile_id: userId,
      p_roster_id: rosterMatch.rosterId,
    },
  );

  if (claimError || claimCreated !== true) {
    if (claimError) {
      console.error("[request-access] Atomic roster claim failed.", {
        code: getErrorCode(claimError),
      });
    }
    await deleteInvitedUser(admin, userId);
    return { created: false };
  }

  return { created: true };
}
