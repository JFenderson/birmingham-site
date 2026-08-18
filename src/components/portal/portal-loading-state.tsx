import { PortalCard } from "@/components/portal/portal-card";
import { cn } from "@/lib/utils";

interface PortalLoadingStateProps {
  label?: string;
  blocks?: number;
  className?: string;
}

export function PortalLoadingState({
  label = "Loading member portal content",
  blocks = 3,
  className,
}: PortalLoadingStateProps) {
  return (
    <PortalCard
      role="status"
      aria-label={label}
      aria-live="polite"
      variant="subtle"
      className={cn("space-y-5 rounded-[2rem] p-5 sm:p-6", className)}
      data-block-count={blocks}
    >
      <div className="space-y-3">
        <div className="h-3 w-28 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-9 w-56 max-w-full animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: blocks }, (_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-[1.5rem] border border-zinc-200/80 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/70"
          >
            <div className="h-5 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-full animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-10 w-32 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </PortalCard>
  );
}
