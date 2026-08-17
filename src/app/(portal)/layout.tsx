import Link from "next/link";
import { redirect } from "next/navigation";
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
    <div className="flex flex-1 flex-col">
      <nav className="flex items-center gap-4 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <Link href="/dashboard" className="font-semibold">
          Dashboard
        </Link>
        <Link href="/events" className="text-sm text-zinc-600 dark:text-zinc-400">
          Events
        </Link>
        <Link href="/vault" className="text-sm text-zinc-600 dark:text-zinc-400">
          Vault
        </Link>
        <Link href="/pay" className="text-sm text-zinc-600 dark:text-zinc-400">
          Pay
        </Link>
        {(role === "Intake Director" || role === "Admin") && (
          <Link href="/intake" className="text-sm text-zinc-600 dark:text-zinc-400">
            Intake
          </Link>
        )}
        {(role === "Admin" || role === "Secretary" || role === "Intake Director") && (
          <Link href="/members/invite" className="text-sm text-zinc-600 dark:text-zinc-400">
            Invite
          </Link>
        )}
        {role === "Admin" && (
          <Link href="/admin" className="text-sm text-zinc-600 dark:text-zinc-400">
            Admin
          </Link>
        )}
        <span className="ml-auto text-sm text-zinc-500">{role}</span>
      </nav>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
