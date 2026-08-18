import { notFound, redirect } from "next/navigation";
import { FileText, MailPlus, NotebookPen } from "lucide-react";
import { PortalCard } from "@/components/portal/portal-card";
import { PortalEmptyState } from "@/components/portal/portal-empty-state";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { PortalStatusBadge } from "@/components/portal/portal-status-badge";
import { requireRole, PermissionError, MfaRequiredError } from "@/lib/auth/rbac";
import { StageForm } from "./stage-form";
import { NoteForm } from "./note-form";
import { InviteButton } from "./invite-button";
import { getInterestFormTypeLabel } from "@/lib/validation/schemas";

const STAGE_OPTIONS = [
  "submitted",
  "under_review",
  "interview",
  "approved",
  "denied",
  "reactivation",
  "transfer",
] as const;

const PAYLOAD_LABELS: Record<string, string> = {
  schoolName: "School",
  major: "Major",
  expectedGraduationYear: "Expected Graduation Year",
  previousChapterName: "Previous Chapter",
  yearsInactive: "Years Inactive",
  message: "Additional Notes from Applicant",
};

const STAGE_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  interview: "Interview",
  approved: "Approved",
  denied: "Denied",
  reactivation: "Reactivation",
  transfer: "Transfer",
};

export default async function IntakeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const { data: applicant } = await session.supabase
    .from("prospective_members")
    .select("*")
    .eq("id", id)
    .eq("chapter_id", session.chapterId)
    .maybeSingle();

  if (!applicant) notFound();

  const { data: notes } = await session.supabase
    .from("prospective_member_notes")
    .select("id, note, created_at, author_id")
    .eq("prospective_member_id", id)
    .order("created_at", { ascending: true });

  const payload = (applicant.submitted_payload ?? {}) as Record<string, unknown>;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <PortalPageHeader
        eyebrow="Intake Detail"
        title={applicant.full_name}
        description={`${applicant.email}${applicant.phone ? ` · ${applicant.phone}` : ""}`}
        badge={<PortalStatusBadge variant="warning">{STAGE_LABELS[applicant.pipeline_stage] ?? applicant.pipeline_stage}</PortalStatusBadge>}
        alert={`${getInterestFormTypeLabel(applicant.form_type)} application submitted ${new Date(applicant.created_at).toLocaleDateString()}.`}
      />

      <PortalCard className="space-y-4 rounded-[2rem] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-navy/8 text-navy dark:bg-blue-400/10 dark:text-blue-200">
            <FileText className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Submission Details
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Information provided through the public join form.
            </p>
          </div>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          {Object.entries(PAYLOAD_LABELS).map(([key, label]) =>
            payload[key] ? (
              <div key={key} className="rounded-[1.5rem] border border-zinc-200 px-4 py-3 dark:border-zinc-800">
                <dt className="text-zinc-500">{label}</dt>
                <dd className="mt-1 text-zinc-950 dark:text-zinc-100">{String(payload[key])}</dd>
              </div>
            ) : null
          )}
        </dl>
      </PortalCard>

      <PortalCard className="rounded-[2rem] p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Pipeline Stage
        </h2>
        <StageForm
          prospectiveMemberId={applicant.id}
          currentStage={applicant.pipeline_stage}
          options={STAGE_OPTIONS}
        />
      </PortalCard>

      {applicant.pipeline_stage === "approved" && (
        <PortalCard className="space-y-4 rounded-[2rem] p-5 sm:p-6" variant="subtle">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-navy/8 text-navy dark:bg-blue-400/10 dark:text-blue-200">
              <MailPlus className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Onboarding
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Send the existing portal invite after an applicant is approved.
              </p>
            </div>
          </div>
          <div>
            <InviteButton fullName={applicant.full_name} email={applicant.email} />
          </div>
        </PortalCard>
      )}

      <PortalCard className="space-y-4 rounded-[2rem] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-navy/8 text-navy dark:bg-blue-400/10 dark:text-blue-200">
            <NotebookPen className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Internal Notes
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Add context for follow-up, interviews, and intake decisions.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {notes && notes.length > 0 ? (
            notes.map((n) => (
              <div
                key={n.id}
                className="rounded-[1.5rem] border border-zinc-200 p-4 text-sm dark:border-zinc-800"
              >
                <p>{n.note}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <PortalEmptyState
              title="No notes yet"
              description="Use internal notes to capture context before interviews or membership decisions."
              className="border-none bg-transparent p-0 shadow-none"
            />
          )}
        </div>
        <NoteForm prospectiveMemberId={applicant.id} />
      </PortalCard>
    </div>
  );
}
