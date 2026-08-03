import { redirect } from "next/navigation";
import { requireRole, PermissionError, MfaRequiredError } from "@/lib/auth/rbac";
import { InviteForm } from "./invite-form";

const INVITE_ROLES = ["Admin", "Secretary", "Intake Director"] as const;

export default async function InviteMemberPage() {
  try {
    await requireRole(INVITE_ROLES);
  } catch (err) {
    if (err instanceof MfaRequiredError) redirect("/security/mfa");
    if (err instanceof PermissionError) redirect("/dashboard");
    throw err;
  }

  return (
    <div className="max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold">Invite a Member</h1>
      <InviteForm />
    </div>
  );
}
