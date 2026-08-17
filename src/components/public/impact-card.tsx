import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LocalImageSource = StaticImageData | `/${string}`;

interface ImpactCardImage {
  src: LocalImageSource;
  alt: string;
}

interface ImpactCardLink {
  href: string;
  label: string;
}

interface ImpactCardProps {
  title: string;
  description: string;
  image?: ImpactCardImage;
  icon?: ReactNode;
  link?: ImpactCardLink;
  className?: string;
}

export function ImpactCard({ title, description, image, icon, link, className }: ImpactCardProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface)] shadow-sm transition-transform hover:-translate-y-1 hover:shadow-[var(--public-shadow)] motion-reduce:transform-none",
        className,
      )}
    >
      {image ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-[var(--public-surface-strong)]">
          <Image src={image.src} alt={image.alt} fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" className="object-cover" />
        </div>
      ) : null}
      <div className="p-6">
        {icon ? (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--public-surface-strong)] text-[var(--public-blue)]" aria-hidden="true">
            {icon}
          </div>
        ) : null}
        <h3 className={cn("text-xl font-bold text-[var(--public-ink)]", icon && "mt-5")}>{title}</h3>
        <p className="mt-3 text-sm leading-7 text-[var(--public-muted)]">{description}</p>
        {link ? (
          <Link
            href={link.href}
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--public-blue)] transition-colors hover:text-[var(--public-blue-deep)]"
          >
            {link.label}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export type { ImpactCardImage, ImpactCardLink, ImpactCardProps };
