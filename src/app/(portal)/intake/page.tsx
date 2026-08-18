import Link from "next/link";
import { redirect } from "next/navigation";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Intake Pipeline</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Applications submitted through the public /join form.
        </p>
      </div>

      {!applicants || applicants.length === 0 ? (
        <p className="text-sm text-zinc-500">No applications yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
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
        </div>
      )}
    </div>
  );
}
