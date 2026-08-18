import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { PortalCard } from "@/components/portal/portal-card";
import { PortalEmptyState } from "@/components/portal/portal-empty-state";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { PortalStatusBadge } from "@/components/portal/portal-status-badge";
import { requireRole, PermissionError, MfaRequiredError } from "@/lib/auth/rbac";
import { getInterestFormTypeLabel } from "@/lib/validation/schemas";

const STAGE_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  interview: "Interview",
  approved: "Approved",
  denied: "Denied",
  reactivation: "Reactivation",
  transfer: "Transfer",
};

export default async function IntakePage() {
  let session;
  try {
    session = await requireRole(["Intake Director", "Admin"]);
  } catch (err) {
    if (err instanceof MfaRequiredError) {
      redirect("/security/mfa");
    }
    if (err instanceof PermissionError) {
      redirect("/dashboard");
    }
    throw err;
  }

  const { data: applicants } = await session.supabase
    .from("prospective_members")
    .select("id, full_name, email, form_type, pipeline_stage, created_at")
    .eq("chapter_id", session.chapterId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <PortalPageHeader
        eyebrow="Applicant Review"
        title="Intake Pipeline"
        description="Monitor the public join pipeline, review applicant details, and keep the intake process moving across mobile and desktop."
        badge={
          <PortalStatusBadge variant={applicants && applicants.length > 0 ? "warning" : "neutral"}>
            {applicants && applicants.length > 0 ? `${applicants.length} applicants` : "No applicants"}
          </PortalStatusBadge>
        }
      />

      {!applicants || applicants.length === 0 ? (
        <PortalEmptyState
          icon={ClipboardList}
          title="No applications yet"
          description="Applications submitted through the public join flow will appear here for review."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 md:hidden">
            {applicants.map((a) => (
              <PortalCard key={a.id} as="article" className="space-y-4 rounded-[2rem] p-5">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <PortalStatusBadge variant="info">
                      {getInterestFormTypeLabel(a.form_type)}
                    </PortalStatusBadge>
                    <PortalStatusBadge variant="warning">
                      {STAGE_LABELS[a.pipeline_stage] ?? a.pipeline_stage}
                    </PortalStatusBadge>
                  </div>
                  <div>
                    <Link href={`/intake/${a.id}`} className="text-lg font-semibold text-zinc-950 hover:text-navy dark:text-zinc-50 dark:hover:text-blue-300">
                      {a.full_name}
                    </Link>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{a.email}</p>
                  </div>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Submitted {new Date(a.created_at).toLocaleDateString()}
                </p>
              </PortalCard>
            ))}
          </div>

          <PortalCard className="hidden overflow-x-auto rounded-[2rem] p-0 md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Stage</th>
                <th className="px-4 py-2">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                >
                  <td className="px-4 py-2">
                    <Link href={`/intake/${a.id}`} className="font-medium hover:underline">
                      {a.full_name}
                    </Link>
                    <div className="text-xs text-zinc-500">{a.email}</div>
                  </td>
                  <td className="px-4 py-2">
                    {getInterestFormTypeLabel(a.form_type)}
                  </td>
                  <td className="px-4 py-2">
                    {STAGE_LABELS[a.pipeline_stage] ?? a.pipeline_stage}
                  </td>
                  <td className="px-4 py-2 text-zinc-500">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </PortalCard>
        </div>
      )}
    </div>
  );
}
