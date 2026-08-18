import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const portalStatusBadgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.14em] uppercase",
  {
    variants: {
      variant: {
        neutral:
          "border-zinc-200 bg-white/85 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200",
        info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
        warning:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
        danger:
          "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

interface PortalStatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof portalStatusBadgeVariants> {
  children: ReactNode;
}

export function PortalStatusBadge({
  children,
  className,
  variant = "neutral",
  ...props
}: PortalStatusBadgeProps) {
  return (
    <span
      data-variant={variant}
      className={cn(portalStatusBadgeVariants({ variant }), className)}
      {...props}
    >
      {children}
    </span>
  );
}

export { portalStatusBadgeVariants };
