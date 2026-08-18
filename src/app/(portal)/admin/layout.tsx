import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AuthorizationError,
  requireChapterAdmin,
} from "@/lib/auth/authorization";

function redirectForAuthorizationError(error: AuthorizationError): never {
  if (error.code === "UNAUTHENTICATED") {
    redirect("/login");
  }

  if (error.code === "MFA_REQUIRED") {
    redirect("/security/mfa");
  }

  redirect("/security/access");
}

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let member;

  try {
    member = await requireChapterAdmin();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirectForAuthorizationError(error);
    }

    throw error;
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-8">
      <header className="flex flex-col gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-navy dark:text-blue-300">Chapter administration</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Admin workspace</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Signed in as {member.profile.fullName} · {member.role.replace("_", " ")}
          </p>
        </div>
        <nav aria-label="Admin navigation" className="flex flex-wrap gap-3 text-sm font-medium">
          <Link href="/admin" className="text-navy hover:underline dark:text-blue-300">
            Overview
          </Link>
          <Link href="/admin/members" className="text-navy hover:underline dark:text-blue-300">
            Members
          </Link>
          <Link href="/events" className="text-navy hover:underline dark:text-blue-300">
            Events
          </Link>
        </nav>
      </header>
      {children}
    </section>
  );
}
