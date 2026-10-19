import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  AuthorizationError,
  requireChapterAdmin,
} from "@/lib/auth/authorization";
import { requireShoeStaff } from "@/lib/shoes/authorization";

function redirectForAuthorizationError(error: AuthorizationError): never {
  if (error.code === "UNAUTHENTICATED") {
    redirect("/login");
  }

  if (error.code === "MFA_REQUIRED") {
    redirect("/security/mfa?next=/admin");
  }

  redirect("/security/access");
}

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let member;
  let roleLabel;

  try {
    if ((await headers()).get("x-shoe-admin-route") === "1") {
      const staff = await requireShoeStaff();
      member = staff.member;
      roleLabel = staff.role;
    } else {
      member = await requireChapterAdmin();
      roleLabel = member.role;
    }
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
            Signed in as {member.profile.fullName} · {roleLabel?.replace("_", " ")}
          </p>
        </div>
        <nav aria-label="Admin navigation" className="flex flex-wrap gap-3 text-sm font-medium">
          {(roleLabel === "chapter_admin" || roleLabel === "super_admin" || roleLabel === "super") ? <Link href="/admin" className="text-navy hover:underline dark:text-blue-300">
            Overview
          </Link> : null}
          {(roleLabel === "chapter_admin" || roleLabel === "super_admin" || roleLabel === "super") ? <Link href="/admin/members" className="text-navy hover:underline dark:text-blue-300">
            Members
          </Link> : null}
          {(roleLabel === "chapter_admin" || roleLabel === "super_admin" || roleLabel === "super") ? <Link href="/events" className="text-navy hover:underline dark:text-blue-300">
            Events
          </Link> : null}
          <Link href="/admin/shoes-for-kids" className="text-navy hover:underline dark:text-blue-300">
            Shoes for Kids
          </Link>
        </nav>
      </header>
      {children}
    </section>
  );
}
