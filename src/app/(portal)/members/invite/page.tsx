import { redirect } from "next/navigation";
import { AuthorizationError, requireChapterAdmin } from "@/lib/auth/authorization";
import { InviteForm } from "./invite-form";

export default async function InviteMemberPage() {
  try {
    await requireChapterAdmin();
  } catch (err) {
    if (err instanceof AuthorizationError && err.code === "UNAUTHENTICATED") redirect("/login");
    if (err instanceof AuthorizationError) redirect("/security/access");
    throw err;
  }

  return (
    <div className="max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold">Invite a Member</h1>
      <InviteForm />
    </div>
  );
}
