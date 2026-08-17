import { cn } from "@/lib/utils";

type SectionHeadingLevel = "h1" | "h2" | "h3";
type SectionHeadingAlignment = "left" | "center";

interface SectionHeadingProps {
  title: string;
  eyebrow?: string;
  description?: string;
  as?: SectionHeadingLevel;
  align?: SectionHeadingAlignment;
  className?: string;
}

export function SectionHeading({
  title,
  eyebrow,
  description,
  as: Heading = "h2",
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? (
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--public-blue)]">{eyebrow}</p>
      ) : null}
      <Heading className="mt-3 font-[family-name:var(--public-font-display)] text-3xl font-bold tracking-tight text-[var(--public-ink)] sm:text-4xl">
        {title}
      </Heading>
      {description ? <p className="mt-4 text-base leading-7 text-[var(--public-muted)] sm:text-lg">{description}</p> : null}
    </div>
  );
}

export type { SectionHeadingProps };
