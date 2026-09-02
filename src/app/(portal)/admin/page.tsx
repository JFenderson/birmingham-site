import Link from "next/link";
import { ArrowRight, Settings2 } from "lucide-react";
import { PortalCard } from "@/components/portal/portal-card";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { PortalStatusBadge } from "@/components/portal/portal-status-badge";

const adminAreas = [
  {
    title: "Scholarship applications",
    description: "Review Sapphire Scholarship applications and supporting documents.",
    href: "/admin/scholarship",
    action: "Review applications",
  },
  {
    title: "Initiative reports",
    description: "Review monthly Black Spending and daily steps totals for PIA reporting.",
    href: "/admin/initiatives",
    action: "Open reports",
  },
  {
    title: "Member management",
    description: "Review approvals, membership status, and administrator access.",
    href: "/admin/members",
    action: "Manage members",
  },
  {
    title: "Events",
    description: "Plan chapter events and review attendance activity.",
    href: "/events",
    action: "Open events",
  },
  {
    title: "Content",
    description: "Manage public chapter content, programs, leadership, and events in Sanity Studio.",
    href: "/studio",
    action: "Open Sanity Studio",
  },
  {
    title: "News",
    description: "Publish chapter announcements and news updates without changing code.",
    href: "/studio/desk/post",
    action: "Manage news",
  },
  {
    title: "Photos",
    description: "Manage chapter media and cover images from the Sanity workspace.",
    href: "/studio",
    action: "Open media workspace",
  },
  {
    title: "Settings",
    description: "Configure chapter-level administration settings.",
  },
] as const;

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <PortalPageHeader
        eyebrow="Chapter Tools"
        title="Administration overview"
        description="Use the chapter management tools below to oversee member access, event planning, and content operations without changing the underlying admin workflows."
        badge={<PortalStatusBadge variant="info">{adminAreas.length} work areas</PortalStatusBadge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adminAreas.map((area) => (
          <PortalCard
            key={area.title}
            as="article"
            variant="elevated"
            className="flex min-h-56 flex-col gap-4 rounded-[2rem] p-5 sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {area.title}
              </h3>
              {"href" in area ? (
                <PortalStatusBadge variant="info">Available</PortalStatusBadge>
              ) : (
                <PortalStatusBadge variant="neutral">Planned</PortalStatusBadge>
              )}
            </div>
            <p className="flex-1 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              {area.description}
            </p>
            {"href" in area ? (
              <Link
                href={area.href}
                className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark"
              >
                {area.action}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : (
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                <Settings2 className="size-4" aria-hidden="true" />
                Planned
              </span>
            )}
          </PortalCard>
        ))}
      </div>
    </div>
  );
}
