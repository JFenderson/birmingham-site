import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { EnrollForm } from "./enroll-form";

export default async function MfaPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="max-w-sm space-y-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">Two-Factor Authentication</h1>
      <EnrollForm />
    </div>
  );
}
