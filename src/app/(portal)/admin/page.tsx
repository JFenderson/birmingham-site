import { redirect } from "next/navigation";
import { requireRole, PermissionError, MfaRequiredError } from "@/lib/auth/rbac";

export default async function AdminPage() {
  try {
    await requireRole(["Admin"]);
  } catch (err) {
    if (err instanceof MfaRequiredError) {
      redirect("/security/mfa");
    }
    if (err instanceof PermissionError) {
      redirect("/dashboard");
    }
    throw err;
  }

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        MFA-verified Admin content goes here.
      </p>
    </div>
  );
}
