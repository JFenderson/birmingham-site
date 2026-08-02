import { redirect } from "next/navigation";
import { requireRole, PermissionError, MfaRequiredError } from "@/lib/auth/rbac";
import { UploadForm } from "./upload-form";

export default async function VaultUploadPage() {
  let role;
  let chapterId;
  try {
    ({ role, chapterId } = await requireRole(["Admin", "Secretary", "Treasurer"]));
  } catch (err) {
    if (err instanceof MfaRequiredError) redirect("/security/mfa");
    if (err instanceof PermissionError) redirect("/vault");
    throw err;
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Upload Document</h1>
      <UploadForm role={role} chapterId={chapterId} />
    </div>
  );
}
