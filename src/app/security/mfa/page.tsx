import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { EnrollForm } from "./enroll-form";
import { resolveSafeLoginRedirect } from "@/lib/security/redirects";

export default async function MfaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="max-w-sm space-y-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">Two-Factor Authentication</h1>
      <p className="text-sm text-zinc-600">Extra verification protects officer tools and private records. You can still use ordinary member features without completing this step.</p>
      <EnrollForm next={resolveSafeLoginRedirect((await searchParams).next)} />
      <a href="/dashboard" className="block text-sm underline">Back to member portal</a>
    </div>
  );
}
