import Link from "next/link";
import { requireChapterAdmin } from "@/lib/auth/authorization";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { SCHOLARSHIP_FILES } from "@/lib/scholarship/application";
import { listScholarshipApplications } from "@/lib/scholarship/admin";
import { PortalPageHeader } from "@/components/portal/portal-page-header";

const fileLabels: Record<string, string> = {
  ...Object.fromEntries(SCHOLARSHIP_FILES.map(({ name, label }) => [name, label])),
  serviceProof: "Community service proof (legacy)",
  signedApplication: "Signed application (legacy)",
};

export default async function ScholarshipReviewPage() {
  await requireChapterAdmin();
  const { chapterId } = await getTenantContext();
  const applications = await listScholarshipApplications(chapterId);

  return (
    <div className="space-y-8">
      <PortalPageHeader eyebrow="Education Director" title="Scholarship applications" description="Review submitted applications and download their private supporting documents." />
      <div className="overflow-x-auto rounded-2xl bg-white p-4 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b"><th className="p-3">Applicant</th><th className="p-3">School</th><th className="p-3">GPA</th><th className="p-3">Status</th><th className="p-3">Documents</th></tr></thead>
          <tbody>
            {applications.map((row) => (
              <tr key={row.id} className="border-b align-top">
                <td className="p-3">{row.applicant.legalName}</td>
                <td className="p-3">{row.applicant.school}</td>
                <td className="p-3">{row.applicant.gpa}</td>
                <td className="p-3">{row.status}</td>
                <td className="p-3">
                  <details>
                    <summary className="cursor-pointer font-semibold text-[#013594]">Download documents</summary>
                    <ul className="mt-2 space-y-1">
                      {Object.keys(row.files ?? {}).filter((name) => name in fileLabels).map((name) => (
                        <li key={name}><Link className="underline" href={`/admin/scholarship/${row.id}/files/${name}`}>{fileLabels[name]}</Link></li>
                      ))}
                    </ul>
                  </details>
                </td>
              </tr>
            ))}
            {applications.length === 0 && <tr><td colSpan={5} className="p-5 text-center text-zinc-600">No scholarship applications yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
