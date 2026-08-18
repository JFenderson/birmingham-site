"use server";

import { requireChapterAdmin } from "@/lib/auth/authorization";
import { provisionMemberInvite } from "@/lib/members/invite-member";
import { inviteMemberSchema } from "@/lib/validation/schemas";
import { getTrustedSiteOrigin } from "@/lib/security/redirects";

export async function inviteMember(
  input: Record<string, unknown>
): Promise<{ error: string | null }> {
  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }

  const { chapterId } = await requireChapterAdmin();
  if (!chapterId) return { error: "An administrator chapter is required for invitations." };
  const origin = getTrustedSiteOrigin();
  if (!origin) return { error: "Could not determine invite link — site configuration is incomplete." };
  const redirectTo = `${origin}/auth/confirm?next=${encodeURIComponent("/accept-invite")}`;

  return provisionMemberInvite({
    chapterId,
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    redirectTo,
  });
}
