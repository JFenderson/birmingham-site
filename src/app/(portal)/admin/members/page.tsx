import Link from "next/link";

import { requireChapterAdmin } from "@/lib/auth/authorization";
import type {
  MemberAccessRole,
  MembershipStatus,
} from "@/lib/auth/authorization";
import { MemberActions } from "./member-actions";

const statusLabels: Record<MembershipStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  suspended: "Suspended",
};

const roleLabels: Record<MemberAccessRole, string> = {
  member: "Member",
  chapter_admin: "Chapter administrator",
  super_admin: "Super administrator",
};

const statusClasses: Record<MembershipStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  suspended: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

export default async function AdminMembersPage() {
  const admin = await requireChapterAdmin();
  let query = admin.supabase
    .from("profiles")
    .select(
      "id, full_name, chapter_id, membership_status, role, approved_at, created_at, chapters(name)",
    )
    .order("full_name", { ascending: true });

  if (admin.role !== "super_admin") {
    if (!admin.chapterId) {
      return (
        <section className="rounded-md border border-red-200 bg-red-50 p-5 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <h2 className="font-semibold">Chapter unavailable</h2>
          <p className="mt-1 text-sm">
            Your administrator profile is not assigned to a chapter.
          </p>
        </section>
      );
    }
    query = query.eq("chapter_id", admin.chapterId);
  }

  const { data: members, error } = await query;

  if (error) {
    console.error("Unable to load the member-management list:", error);
    return (
      <section
        role="alert"
        className="rounded-md border border-red-200 bg-red-50 p-5 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
      >
        <h2 className="font-semibold">Members could not be loaded</h2>
        <p className="mt-1 text-sm">Refresh the page to try again.</p>
      </section>
    );
  }

  const viewerRole = admin.role as Extract<
    MemberAccessRole,
    "chapter_admin" | "super_admin"
  >;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Member management</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {admin.role === "super_admin"
              ? "Review and manage member access across all chapters."
              : "Review and manage member access for your current chapter."}
          </p>
        </div>
        <Link
          href="/members/invite"
          className="inline-flex w-fit rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark"
        >
          Invite a member
        </Link>
      </div>

      {!members || members.length === 0 ? (
        <section className="rounded-md border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <h3 className="font-semibold">No members found</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Invited and registered members will appear here.
          </p>
        </section>
      ) : (
        <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Members available to the current administrator
            </caption>
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th scope="col" className="px-4 py-3">Member</th>
                {admin.role === "super_admin" && (
                  <th scope="col" className="px-4 py-3">Chapter</th>
                )}
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Role</th>
                <th scope="col" className="px-4 py-3">Created</th>
                <th scope="col" className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const isSelf = member.id === admin.user.id;
                const canManage =
                  admin.role === "super_admin" || member.role !== "super_admin";

                return (
                  <tr
                    key={member.id}
                    className="border-b border-zinc-100 align-top last:border-0 dark:border-zinc-800"
                  >
                    <th scope="row" className="px-4 py-4 font-medium">
                      {member.full_name}
                      {isSelf && (
                        <span className="ml-2 text-xs font-normal text-zinc-500">
                          You
                        </span>
                      )}
                    </th>
                    {admin.role === "super_admin" && (
                      <td className="px-4 py-4 text-zinc-600 dark:text-zinc-400">
                        {member.chapters?.name ?? "Unassigned"}
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[member.membership_status]}`}
                      >
                        {statusLabels[member.membership_status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-zinc-600 dark:text-zinc-400">
                      {roleLabels[member.role]}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <MemberActions
                        memberId={member.id}
                        memberName={member.full_name}
                        status={member.membership_status}
                        role={member.role}
                        viewerRole={viewerRole}
                        isSelf={isSelf}
                        canManage={canManage}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
