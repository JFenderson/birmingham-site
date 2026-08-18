import { redirect } from "next/navigation";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalMobileNav } from "@/components/portal/portal-mobile-nav";
import { PortalSidebar } from "@/components/portal/portal-sidebar";
import { getSession } from "@/lib/auth/session";
import { requireRole, PermissionError, MfaRequiredError } from "@/lib/auth/rbac";

const ALL_ROLES = [
  "Member",
  "Treasurer",
  "Secretary",
  "Intake Director",
  "Admin",
] as const;

export default async function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let role;
  try {
    ({ role } = await requireRole(ALL_ROLES));
  } catch (err) {
    if (err instanceof MfaRequiredError) {
      redirect("/security/mfa");
    }
    if (err instanceof PermissionError) {
      const session = await getSession();
      redirect(session ? "/security/access" : "/login");
    }
    throw err;
  }

  return (
    <div className="flex min-h-screen flex-1 bg-zinc-100/70 dark:bg-zinc-950">
      <PortalSidebar role={role} />
      <div className="flex min-h-screen flex-1 flex-col">
        <PortalHeader role={role} />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
          {children}
        </main>
        <PortalMobileNav role={role} />
      </div>
    </div>
  );
}
