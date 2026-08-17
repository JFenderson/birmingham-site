import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentCtaAction {
  href: string;
  label: string;
}

interface ContentCtaProps {
  title: string;
  description: string;
  action: ContentCtaAction;
  secondaryAction?: ContentCtaAction;
  className?: string;
}

export function ContentCta({ title, description, action, secondaryAction, className }: ContentCtaProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl bg-[var(--public-blue)] px-6 py-10 text-white shadow-[var(--public-shadow)] sm:px-10 sm:py-12",
        className,
      )}
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-[family-name:var(--public-font-display)] text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-4 text-base leading-7 text-blue-50/90 sm:text-lg">{description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[var(--public-blue-deep)] transition-transform hover:-translate-y-0.5 hover:bg-blue-50 motion-reduce:transform-none"
          >
            {action.label}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          {secondaryAction ? (
            <Link
              href={secondaryAction.href}
              className="inline-flex items-center rounded-full border border-white/50 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/15"
            >
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export type { ContentCtaAction, ContentCtaProps };
