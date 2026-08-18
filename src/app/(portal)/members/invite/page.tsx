import { redirect } from "next/navigation";
import { PortalCard } from "@/components/portal/portal-card";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { AuthorizationError, requireChapterAdmin } from "@/lib/auth/authorization";
import { InviteForm } from "./invite-form";

export default async function InviteMemberPage() {
  try {
    await requireChapterAdmin();
  } catch (err) {
    if (err instanceof AuthorizationError && err.code === "UNAUTHENTICATED") redirect("/login");
    if (err instanceof AuthorizationError) redirect("/security/access");
    throw err;
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <PortalPageHeader
        eyebrow="Member Access"
        title="Invite a Member"
        description="Send a portal invite without changing the existing admin authorization or invite workflow."
      />
      <PortalCard className="rounded-[2rem] p-5 sm:p-6" variant="elevated">
        <InviteForm />
      </PortalCard>
    </div>
  );
}
