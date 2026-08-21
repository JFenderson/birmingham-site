import Link from "next/link";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
import { GraduationCap, HeartHandshake, Users } from "lucide-react";
import { CollegiateHome } from "@/components/collegiate/collegiate-home";
import { ContentCta } from "@/components/public/content-cta";
import { Hero } from "@/components/public/hero";
import { ImpactCard } from "@/components/public/impact-card";
import { SectionHeading } from "@/components/public/section-heading";
import { getSafeImageAlt, resolveHomepageContent } from "@/lib/public-content";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";
import { sanityClient } from "@/sanity/client";
import { getPublishedHomepageSettings } from "@/sanity/queries";

const PRINCIPLES = [
  {
    icon: Users,
    title: "Brotherhood",
    description: "A lifelong community of men committed to fellowship, support, and uplifting one another through every season of life.",
  },
  {
    icon: GraduationCap,
    title: "Scholarship",
    description: "A tradition of academic excellence, leadership, and disciplined growth that strengthens our members and our community.",
  },
  {
    icon: HeartHandshake,
    title: "Service",
    description: "A mission rooted in service, impact, and giving back through meaningful programs and outreach across Birmingham.",
  },
];

const builder = createImageUrlBuilder(sanityClient);

function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

export default async function Home() {
  const chapter = await getCurrentChapter();

  if (chapter.siteType === "collegiate") {
    return <CollegiateHome chapter={chapter} />;
  }

  const settings = await getPublishedHomepageSettings(chapter.chapterSlug);
  const content = resolveHomepageContent(chapter.name, settings);
  const heroImageAlt = getSafeImageAlt(content.hero.image);
  const featuredPresidentImageAlt = getSafeImageAlt(content.featuredPresident.image);
  const heroImage =
    content.hero.image && heroImageAlt
      ? {
          src: urlFor(content.hero.image).width(1100).fit("max").url(),
          alt: heroImageAlt,
        }
      : null;

  return (
    <>
      <Hero
        eyebrow={content.hero.eyebrow}
        title={content.hero.title}
        description={content.hero.description}
        primaryAction={content.hero.primaryAction}
        secondaryAction={content.hero.secondaryAction}
        {...(heroImage ? { image: heroImage } : {})}
      />

      <section className="bg-[var(--public-surface)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <SectionHeading
            align="center"
            eyebrow="Our foundation"
            title="Built on the principles that move our community forward"
            description="Tau Sigma brings members, neighbors, and partners together around the ideals that have guided Phi Beta Sigma for generations."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PRINCIPLES.map(({ icon: Icon, title, description }) => (
              <ImpactCard key={title} title={title} description={description} icon={<Icon className="h-5 w-5" />} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--public-surface-subtle)] py-16 sm:py-20">
        <div className="mx-auto grid max-w-[var(--public-content-max)] gap-10 px-[var(--public-gutter)] lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:items-center">
          <SectionHeading
            eyebrow="Our story"
            title="A Birmingham chapter with a commitment to the next generation"
            description="Tau Sigma proudly serves the Birmingham area while supporting collegiate chapters at Miles College, UAB, Talladega College, and Jacksonville State University. Our work honors chapter legacy and creates practical opportunities for the communities we call home."
          />
          <Link
            href="/about"
            className="rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface)] p-7 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-[var(--public-shadow)] motion-reduce:transform-none"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--public-blue)]">Explore Tau Sigma</p>
            <p className="mt-3 text-xl font-bold text-[var(--public-ink)]">Learn about our history, leadership, and programs.</p>
            <p className="mt-3 text-sm leading-7 text-[var(--public-muted)]">See how the chapter carries its service-centered legacy into Birmingham today.</p>
          </Link>
        </div>
      </section>

      <section className="bg-[var(--public-surface)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <SectionHeading
            eyebrow={content.featuredPresident.eyebrow}
            title={content.featuredPresident.title}
            description={content.featuredPresident.description}
          />
          <div className="mt-8 flex flex-col gap-6 rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface-subtle)] p-7 sm:flex-row sm:items-center sm:justify-between">
            {content.featuredPresident.image && featuredPresidentImageAlt ? (
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-[var(--public-border)] bg-[var(--public-surface-strong)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={urlFor(content.featuredPresident.image).width(240).height(240).url()}
                  alt={featuredPresidentImageAlt}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
            <div>
              <p className="text-xl font-bold text-[var(--public-ink)]">{content.featuredPresident.name}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--public-blue)]">{content.featuredPresident.role}</p>
            </div>
            <Link
              href={content.featuredPresident.link.href}
              className="text-sm font-bold text-[var(--public-blue)] transition-colors hover:text-[var(--public-blue-deep)]"
            >
              {content.featuredPresident.link.label}
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[var(--public-surface-subtle)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <SectionHeading
            align="center"
            eyebrow={content.communityImpact.eyebrow}
            title={content.communityImpact.title}
            description={content.communityImpact.description}
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {content.communityImpact.initiatives.map((initiative) => {
              const initiativeImageAlt = getSafeImageAlt(initiative.image);
              const initiativeImage =
                initiative.image && initiativeImageAlt
                  ? {
                      src: urlFor(initiative.image).width(800).height(450).url(),
                      alt: initiativeImageAlt,
                    }
                  : null;

              return (
              <ImpactCard
                key={initiative.title}
                title={initiative.title}
                description={initiative.description}
                {...(initiativeImage ? { image: initiativeImage } : {})}
                {...(initiative.link ? { link: initiative.link } : {})}
              />
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[var(--public-surface)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <SectionHeading
            align="center"
            eyebrow="Stay connected"
            title="Latest chapter news and upcoming community events"
            description="Follow along as the chapter shares announcements, service opportunities, and ways to take part in Birmingham."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <ImpactCard
              title="Chapter news"
              description="Read the latest updates, announcements, and stories from Tau Sigma."
              link={{ href: "/news", label: "Read chapter news" }}
            />
            <ImpactCard
              title="Community events"
              description="Find signature programs and year-round service commitments across Birmingham."
              link={{ href: "/community-events", label: "View community events" }}
            />
          </div>
        </div>
      </section>

      <section className="bg-[var(--public-surface-subtle)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <ContentCta
            title="Partner with Tau Sigma"
            description="Connect with the chapter for community partnerships, service opportunities, and chapter information."
            action={{ href: "/contact", label: "Contact the chapter" }}
            secondaryAction={{ href: "/about", label: "About Tau Sigma" }}
          />
        </div>
      </section>
    </>
  );
}
