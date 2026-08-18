import { redirect } from "next/navigation";
import { PortalCard } from "@/components/portal/portal-card";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
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
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <PortalPageHeader
        eyebrow="Document Vault"
        title="Upload Document"
        description="Add chapter files to the vault using the current upload and storage rules, with a more comfortable mobile form layout."
      />
      <PortalCard className="rounded-[2rem] p-5 sm:p-6" variant="elevated">
        <UploadForm role={role} chapterId={chapterId} />
      </PortalCard>
    </div>
  );
}
