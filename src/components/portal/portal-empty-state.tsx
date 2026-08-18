import type { ComponentType, ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortalEmptyStateProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  action?: ReactNode;
}

export function PortalEmptyState({
  action,
  className,
  description,
  icon: Icon = Inbox,
  title,
  ...props
}: PortalEmptyStateProps) {
  return (
    <section
      className={cn(
        "flex flex-col items-start gap-4 rounded-[1.75rem] border border-dashed border-zinc-300 bg-white/75 p-6 text-left shadow-sm dark:border-zinc-700 dark:bg-zinc-950/65 sm:p-8",
        className,
      )}
      {...props}
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-navy/8 text-navy dark:bg-blue-400/10 dark:text-blue-300">
        <Icon className="size-5" aria-hidden={true} />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </section>
  );
}
