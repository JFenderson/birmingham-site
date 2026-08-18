import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const portalCardVariants = cva(
  "rounded-[1.75rem] border p-5 shadow-sm transition-colors sm:p-6",
  {
    variants: {
      variant: {
        default: "border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-zinc-950/90",
        subtle: "border-zinc-200/80 bg-zinc-50/85 dark:border-zinc-800 dark:bg-zinc-900/75",
        elevated:
          "border-zinc-200 bg-white shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface PortalCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof portalCardVariants> {
  children: ReactNode;
  as?: "article" | "div" | "section";
}

export function PortalCard({
  as: Component = "section",
  children,
  className,
  variant,
  ...props
}: PortalCardProps) {
  return (
    <Component className={cn(portalCardVariants({ variant }), className)} {...props}>
      {children}
    </Component>
  );
}

export { portalCardVariants };
