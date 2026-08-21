import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type HeroHeadingLevel = "h1" | "h2";
type ImageSource = StaticImageData | string;

interface HeroAction {
  href: string;
  label: string;
}

interface HeroImage {
  src: ImageSource;
  alt: string;
}

interface HeroProps {
  title: string;
  eyebrow?: string;
  description?: string;
  primaryAction?: HeroAction;
  secondaryAction?: HeroAction;
  image?: HeroImage;
  decorativeBackgroundImage?: string;
  headingLevel?: HeroHeadingLevel;
  className?: string;
}

export function Hero({
  title,
  eyebrow,
  description,
  primaryAction,
  secondaryAction,
  image,
  decorativeBackgroundImage,
  headingLevel = "h1",
  className,
}: HeroProps) {
  const Heading = headingLevel;

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden bg-[var(--public-blue-deep)] text-white",
        className,
      )}
    >
      {decorativeBackgroundImage ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${decorativeBackgroundImage})` }}
        />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgb(0_59_142_/_96%)_0%,rgb(0_71_171_/_88%)_55%,rgb(0_71_171_/_64%)_100%)]" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-[34rem] max-w-[var(--public-content-max)] items-center gap-10 px-[var(--public-gutter)] py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)] lg:py-24">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-100">{eyebrow}</p>
          ) : null}
          <Heading className="mt-4 font-[family-name:var(--public-font-display)] text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {title}
          </Heading>
          {description ? <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50/90">{description}</p> : null}

          {primaryAction || secondaryAction ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {primaryAction ? (
                <Link
                  href={primaryAction.href}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[var(--public-blue-deep)] transition-transform hover:-translate-y-0.5 hover:bg-blue-50 motion-reduce:transform-none"
                >
                  {primaryAction.label}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              ) : null}
              {secondaryAction ? (
                <Link
                  href={secondaryAction.href}
                  className="inline-flex items-center rounded-full border border-white/50 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/15"
                >
                  {secondaryAction.label}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        {image ? (
          <div className="relative aspect-[3/2] object-contain overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              unoptimized={typeof image.src === "string" && image.src.startsWith("http")}
              sizes="(max-width: 1023px) calc(100vw - (var(--public-gutter) * 2)), 40vw"
              className="object-contain"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export type { HeroAction, HeroImage, HeroProps };
