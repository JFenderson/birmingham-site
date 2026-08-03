"use server";

import { requireRole } from "@/lib/auth/rbac";
import { provisionMemberInvite } from "@/lib/members/invite-member";
import { inviteMemberSchema } from "@/lib/validation/schemas";

const INVITE_ROLES = ["Admin", "Secretary", "Intake Director"] as const;

export async function inviteMember(
  input: Record<string, unknown>
): Promise<{ error: string | null }> {
  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }

  const { chapterId } = await requireRole(INVITE_ROLES);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const redirectTo = `${siteUrl}/auth/confirm?next=${encodeURIComponent("/accept-invite")}`;

  return provisionMemberInvite({
    chapterId,
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    redirectTo,
  });
}
