import {
  CreditCard,
  FolderLock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { DashboardCard } from "@/components/portal/dashboard-card";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { requireRole } from "@/lib/auth/rbac";
import { buildDashboardSections } from "@/lib/dashboard/sections";

const ALL_ROLES = [
  "Member",
  "Treasurer",
  "Secretary",
  "Intake Director",
  "Admin",
] as const;

export default async function DashboardPage() {
  const { user, role, chapterId, supabase } = await requireRole(ALL_ROLES, { requireMfa: false });

  const { data: events } = await supabase
    .from("events")
    .select("id, title, starts_at, location_name")
    .eq("chapter_id", chapterId)
    .eq("is_deleted", false)
    .order("starts_at", { ascending: true });

  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, category, created_at")
    .eq("chapter_id", chapterId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, type, amount_cents, status, description, created_at")
    .eq("chapter_id", chapterId)
    .eq("profile_id", user.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  const sections = buildDashboardSections({
    userEmail: user.email ?? "member",
    role,
    chapterId,
    events: events ?? [],
    documents: documents ?? [],
    transactions: transactions ?? [],
  });

  return (
    <div className="space-y-8">
      <PortalPageHeader
        eyebrow="Member Portal"
        title={`Welcome back, ${user.email ?? "brother"}`}
        description="Your chapter activity, records, payments, and account access are organized here in a mobile-first dashboard."
      />

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {sections.map((section) => {
          const icon =
            section.title === "Events"
              ? Sparkles
              : section.title === "Vault"
                ? FolderLock
                : section.title === "Payments"
                  ? CreditCard
                  : ShieldCheck;

          return <DashboardCard key={section.title} icon={icon} {...section} />;
        })}
      </div>
    </div>
  );
}
