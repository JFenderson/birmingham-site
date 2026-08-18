import { redirect } from "next/navigation";
import { PortalCard } from "@/components/portal/portal-card";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { PortalStatusBadge } from "@/components/portal/portal-status-badge";
import {
  AuthorizationError,
  requireApprovedMember,
} from "@/lib/auth/authorization";

const roleLabels = {
  member: "Member",
  chapter_admin: "Chapter administrator",
  super_admin: "Super administrator",
} as const;

function redirectForAuthorizationError(error: AuthorizationError): never {
  if (error.code === "UNAUTHENTICATED") {
    redirect("/login");
  }

  redirect("/security/access");
}

export default async function AccountPage() {
  let member;

  try {
    member = await requireApprovedMember();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirectForAuthorizationError(error);
    }

    throw error;
  }

  const accountDetails = [
    ["Name", member.profile.fullName],
    ["Email", member.user.email ?? "Not available"],
    ["Phone", member.profile.phone ?? "Not provided"],
    ["Membership status", "Approved"],
    ["Role", roleLabels[member.role]],
  ] as const;

  return (
    <section className="mx-auto w-full max-w-4xl space-y-8">
      <PortalPageHeader
        eyebrow="Member Profile"
        title="Account"
        description="Your current member profile, chapter access, and contact details are collected here for quick reference."
        badge={<PortalStatusBadge variant="success">Approved member</PortalStatusBadge>}
      />

      <PortalCard className="overflow-hidden rounded-[2rem] p-0" variant="elevated">
        <dl className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {accountDetails.map(([label, value]) => (
          <div key={label} className="grid gap-1 px-5 py-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</dt>
            <dd className="text-sm text-zinc-900 dark:text-zinc-100">{value}</dd>
          </div>
        ))}
        </dl>
      </PortalCard>

      <PortalCard className="rounded-[2rem] p-5 sm:p-6" variant="subtle">
        <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          Contact a chapter administrator if any account details or access information need to be corrected.
        </p>
      </PortalCard>
    </section>
  );
}
