import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { PortalCard } from "@/components/portal/portal-card";
import { PortalStatusBadge } from "@/components/portal/portal-status-badge";

export interface DashboardCardProps {
  title: string;
  href: string;
  summary: string;
  detail: string;
  badgeLabel: string;
  badgeVariant: "neutral" | "info" | "success" | "warning" | "danger";
  icon?: LucideIcon;
}

export function DashboardCard({
  title,
  href,
  summary,
  detail,
  badgeLabel,
  badgeVariant,
  icon: Icon,
}: DashboardCardProps) {
  return (
    <PortalCard
      as="article"
      variant="elevated"
      className="flex h-full flex-col gap-5 rounded-[2rem] p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {Icon ? (
              <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-navy/8 text-navy dark:bg-blue-400/10 dark:text-blue-200">
                <Icon className="size-5" aria-hidden="true" />
              </span>
            ) : null}
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              {title}
            </h2>
          </div>
          <PortalStatusBadge variant={badgeVariant}>{badgeLabel}</PortalStatusBadge>
        </div>

        <Link
          href={href}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition hover:border-navy hover:text-navy dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-blue-400 dark:hover:text-blue-200"
          aria-label={`Open ${title}`}
        >
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="space-y-2">
        <p className="text-base font-medium leading-7 text-zinc-950 dark:text-zinc-50">
          {summary}
        </p>
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{detail}</p>
      </div>
    </PortalCard>
  );
}
