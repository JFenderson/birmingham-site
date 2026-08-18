import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortalPageHeaderProps {
  title: string;
  eyebrow?: string;
  description?: string;
  badge?: ReactNode;
  action?: ReactNode;
  alert?: ReactNode;
  className?: string;
}

export function PortalPageHeader({
  title,
  eyebrow,
  description,
  badge,
  action,
  alert,
  className,
}: PortalPageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-navy/75 dark:text-blue-300">
              {eyebrow}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
              {title}
            </h1>
            {badge}
          </div>

          {description ? (
            <p className="max-w-3xl text-sm leading-7 text-zinc-600 dark:text-zinc-400 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      {alert ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50/90 px-4 py-3 text-sm text-sky-800 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-100"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0">{alert}</div>
        </div>
      ) : null}
    </div>
  );
}
