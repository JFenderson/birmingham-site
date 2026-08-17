import { redirect } from "next/navigation";
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
    <section className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Your current member profile and chapter access details.
        </p>
      </div>

      <dl className="divide-y divide-zinc-200 overflow-hidden rounded-md border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
        {accountDetails.map(([label, value]) => (
          <div key={label} className="grid gap-1 px-5 py-4 sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</dt>
            <dd className="text-sm text-zinc-900 dark:text-zinc-100 sm:col-span-2">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Contact a chapter administrator if any account details or access information need to be corrected.
      </p>
    </section>
  );
}
