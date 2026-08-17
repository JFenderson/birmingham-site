import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function AccessPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-md border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Signed in, but access is not yet enabled
        </h1>
        <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          Your account authenticated successfully, but it is not currently assigned to a chapter role.
          If you expected access, please contact a chapter officer to confirm your membership record and role assignment.
        </p>
        <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          Account: {session.user.email}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark"
          >
            Return to Login
          </Link>
          <Link
            href="/"
            className="inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
