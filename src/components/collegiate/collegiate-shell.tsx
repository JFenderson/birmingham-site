import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import type { SiteContext } from "@/lib/tenant/site-context";

type BrandedStyle = CSSProperties & Record<`--${string}`, string>;

interface CollegiateShellProps {
  chapter: SiteContext;
  children: ReactNode;
}

export function CollegiateShell({ chapter, children }: CollegiateShellProps) {
  const style: BrandedStyle = {
    "--public-blue": chapter.branding.primaryColor,
    "--public-blue-deep": chapter.branding.accentColor,
    "--public-surface": chapter.branding.secondaryColor,
  };

  return (
    <div data-chapter-slug={chapter.slug} data-site-type={chapter.siteType} style={style}>
      <div className="border-b border-[var(--public-border)] bg-[var(--public-surface)]">
        <div className="mx-auto flex max-w-[var(--public-content-max)] items-center gap-4 px-[var(--public-gutter)] py-4">
          {chapter.branding.logoUrl ? (
            <Image
              src={chapter.branding.logoUrl}
              alt={`${chapter.name} logo`}
              width={56}
              height={56}
              unoptimized
              className="h-14 w-14 rounded-full object-contain"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--public-blue)] text-sm font-bold text-white"
            >
              ΦΒΣ
            </span>
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--public-blue)]">
              Collegiate chapter
            </p>
            <p className="mt-1 font-[family-name:var(--public-font-display)] text-lg font-bold text-[var(--public-ink)]">
              {chapter.name}
            </p>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

export type { CollegiateShellProps };
