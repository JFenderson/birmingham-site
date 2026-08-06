import { createAdminClient } from "@/lib/supabase/admin";

export async function provisionMemberInvite(params: {
  chapterId: string;
  fullName: string;
  email: string;
  redirectTo: string;
}): Promise<{ error: string | null }> {
  const admin = createAdminClient();

  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(params.email, {
      data: { full_name: params.fullName },
      redirectTo: params.redirectTo,
    });

  if (inviteError || !inviteData?.user) {
    // Supabase returns a distinct error when the email already belongs to
    // an existing user — this IS the duplicate-invite check; no separate
    // tracking column is needed.
    if (inviteError?.code === "email_exists" || inviteError?.message?.toLowerCase().includes("already been registered")) {
      return { error: "This person already has an account." };
    }
    return { error: "Could not send invite. Please try again." };
  }

  const userId = inviteData.user.id;

  // handle_new_user (00000000000003_profiles.sql) already auto-created the
  // profiles row from raw_user_meta_data.full_name — only chapter_members
  // needs inserting here.
  const { error: memberError } = await admin.from("chapter_members").insert({
    chapter_id: params.chapterId,
    profile_id: userId,
    role: "Member",
  });

  if (memberError) {
    if (memberError.code === "23505") {
      // Supabase re-invites a still-pending user rather than erroring on a
      // second invite attempt, so this insert re-runs against a person
      // already in this chapter. Never delete the account here — an
      // officer re-clicking "Invite" (the normal recovery when an email
      // doesn't arrive) must not be able to destroy the pending account.
      return { error: "This person has already been invited to this chapter." };
    }
    console.error("[invite] chapter_members insert failed, leaving account for manual review", {
      userId,
      error: memberError,
    });
    return { error: "Could not complete invite. Please try again." };
  }

  return { error: null };
}
