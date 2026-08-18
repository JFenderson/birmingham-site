import {
  CreditCard,
  FolderLock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { DashboardCard } from "@/components/portal/dashboard-card";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { requireRole } from "@/lib/auth/rbac";
import type { MemberRole } from "@/types/domain";

const ALL_ROLES = [
  "Member",
  "Treasurer",
  "Secretary",
  "Intake Director",
  "Admin",
] as const;

type DashboardEvent = {
  id: string;
  title: string;
  starts_at: string;
  location_name: string | null;
};

type DashboardDocument = {
  id: string;
  title: string;
  category: string;
  created_at: string;
};

type DashboardTransaction = {
  id: string;
  type: string;
  amount_cents: number;
  status: string;
  description: string | null;
  created_at: string;
};

export interface DashboardSection {
  title: string;
  href: string;
  summary: string;
  detail: string;
  badgeLabel: string;
  badgeVariant: "neutral" | "info" | "success" | "warning" | "danger";
}

interface BuildDashboardSectionsInput {
  userEmail: string;
  role: MemberRole | string;
  chapterId: string;
  events: DashboardEvent[];
  documents: DashboardDocument[];
  transactions: DashboardTransaction[];
  now?: Date;
}

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const longDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

function formatCount(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatTransactionStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getTransactionBadgeVariant(status: string): DashboardSection["badgeVariant"] {
  switch (status) {
    case "completed":
      return "success";
    case "pending":
      return "warning";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

function formatTransactionLabel(transaction: DashboardTransaction) {
  if (transaction.description?.trim()) {
    return transaction.description.trim();
  }

  if (transaction.type === "event_fee") {
    return "Event fee";
  }

  return transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);
}

export function buildDashboardSections({
  userEmail,
  role,
  chapterId,
  events,
  documents,
  transactions,
  now = new Date(),
}: BuildDashboardSectionsInput): DashboardSection[] {
  const upcomingEvents = events
    .filter((event) => new Date(event.starts_at) >= now)
    .toSorted(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
  const sortedDocuments = documents.toSorted(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const sortedTransactions = transactions.toSorted(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const nextEvent = upcomingEvents[0];
  const latestDocument = sortedDocuments[0];
  const latestTransaction = sortedTransactions[0];
  const documentCategories = new Set(documents.map((document) => document.category)).size;

  return [
    {
      title: "Events",
      href: "/events",
      summary: nextEvent
        ? nextEvent.title
        : "No upcoming chapter events yet.",
      detail: nextEvent
        ? `${formatCount(upcomingEvents.length, "event")} scheduled. ${longDateTimeFormatter.format(new Date(nextEvent.starts_at))}${nextEvent.location_name ? ` at ${nextEvent.location_name}` : ""}.`
        : "Check upcoming meetings, service projects, and chapter gatherings from one place.",
      badgeLabel: nextEvent ? formatCount(upcomingEvents.length, "event") : "Quiet week",
      badgeVariant: nextEvent ? "success" : "neutral",
    },
    {
      title: "Vault",
      href: "/vault",
      summary: latestDocument
        ? latestDocument.title
        : "No chapter documents in the vault yet.",
      detail: latestDocument
        ? `${formatCount(documents.length, "document")} available across ${formatCount(documentCategories, "category")}. Latest upload on ${shortDateFormatter.format(new Date(latestDocument.created_at))}.`
        : "Minutes, bylaws, and financial documents will appear here as officers upload them.",
      badgeLabel: latestDocument ? formatCount(documents.length, "document") : "Empty",
      badgeVariant: latestDocument ? "info" : "neutral",
    },
    {
      title: "Payments",
      href: "/pay",
      summary: latestTransaction
        ? `Latest payment: ${moneyFormatter.format(latestTransaction.amount_cents / 100)}`
        : "No recorded payments yet.",
      detail: latestTransaction
        ? `${formatTransactionStatus(latestTransaction.status)} ${formatTransactionLabel(latestTransaction)} on ${shortDateFormatter.format(new Date(latestTransaction.created_at))}.`
        : "Use the pay page to submit dues, event fees, and donations through the existing checkout flow.",
      badgeLabel: latestTransaction
        ? formatTransactionStatus(latestTransaction.status)
        : "No history",
      badgeVariant: latestTransaction
        ? getTransactionBadgeVariant(latestTransaction.status)
        : "neutral",
    },
    {
      title: "Account Status",
      href: "/account",
      summary: `${role} access for ${userEmail}`,
      detail: `Signed in to chapter ${chapterId}. Review your member profile and chapter access details anytime.`,
      badgeLabel: "Signed in",
      badgeVariant: "neutral",
    },
  ];
}

export default async function DashboardPage() {
  const { user, role, chapterId, supabase } = await requireRole(ALL_ROLES);

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
