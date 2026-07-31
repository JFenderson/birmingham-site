import { requireRole } from "@/lib/auth/rbac";

const ALL_ROLES = [
  "Member",
  "Treasurer",
  "Secretary",
  "Intake Director",
  "Admin",
] as const;

export default async function DashboardPage() {
  const { user, role, chapterId } = await requireRole(ALL_ROLES);

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Welcome, {user.email}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Role: {role} · Chapter: {chapterId}
      </p>
    </div>
  );
}
