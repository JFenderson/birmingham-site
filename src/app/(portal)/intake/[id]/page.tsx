import { notFound, redirect } from "next/navigation";
import { requireRole, PermissionError, MfaRequiredError } from "@/lib/auth/rbac";
import { StageForm } from "./stage-form";
import { NoteForm } from "./note-form";

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
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{applicant.full_name}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {applicant.email}
          {applicant.phone ? ` · ${applicant.phone}` : ""}
        </p>
        <p className="mt-1 text-sm capitalize text-zinc-500">
          {applicant.form_type} application · submitted{" "}
          {new Date(applicant.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase text-zinc-500">
          Submission Details
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          {Object.entries(PAYLOAD_LABELS).map(([key, label]) =>
            payload[key] ? (
              <div key={key}>
                <dt className="text-zinc-500">{label}</dt>
                <dd>{String(payload[key])}</dd>
              </div>
            ) : null
          )}
        </dl>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase text-zinc-500">
          Pipeline Stage
        </h2>
        <StageForm
          prospectiveMemberId={applicant.id}
          currentStage={applicant.pipeline_stage}
          options={STAGE_OPTIONS}
        />
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase text-zinc-500">
          Internal Notes
        </h2>
        <div className="mt-3 space-y-3">
          {notes && notes.length > 0 ? (
            notes.map((n) => (
              <div
                key={n.id}
                className="rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800"
              >
                <p>{n.note}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-500">No notes yet.</p>
          )}
        </div>
        <NoteForm prospectiveMemberId={applicant.id} />
      </div>
    </div>
  );
}
