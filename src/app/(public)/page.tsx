import Link from "next/link";
import { GraduationCap, HeartHandshake, Users } from "lucide-react";
import { CollegiateHome } from "@/components/collegiate/collegiate-home";
import { ContentCta } from "@/components/public/content-cta";
import { Hero } from "@/components/public/hero";
import { ImpactCard } from "@/components/public/impact-card";
import { SectionHeading } from "@/components/public/section-heading";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";

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

const INITIATIVES = [
  {
    title: "BHM Blue and White Weekend",
    description: "A signature chapter gathering that brings fellowship, legacy, and service together in Birmingham.",
  },
  {
    title: "Shoes for Kids",
    description: "Annual outreach that helps students begin the school year with confidence and support.",
  },
  {
    title: "Toys for Kids",
    description: "Holiday service that partners with local families and organizations to share joy and resources.",
  },
];

export default async function Home() {
  const chapter = await getCurrentChapter();

  if (chapter.siteType === "collegiate") {
    return <CollegiateHome chapter={chapter} />;
  }

  return (
    <>
      <Hero
        eyebrow="Birmingham Sigmas · Phi Beta Sigma Fraternity, Inc."
        title={chapter.name}
        description="Serving Birmingham and Jefferson County through brotherhood, scholarship, and service for humanity."
        primaryAction={{ href: "/about", label: "Discover our chapter" }}
        secondaryAction={{ href: "/contact", label: "Connect with us" }}
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
            eyebrow="From the president"
            title="Service-driven leadership, rooted in brotherhood"
            description="Tau Sigma leadership is committed to thoughtful planning, chapter accountability, member development, and service that reaches beyond our meetings."
          />
          <div className="mt-8 flex flex-col gap-5 rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface-subtle)] p-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xl font-bold text-[var(--public-ink)]">Bro. Joseph Fenderson</p>
              <p className="mt-1 text-sm font-semibold text-[var(--public-blue)]">Chapter President</p>
            </div>
            <Link href="/photos" className="text-sm font-bold text-[var(--public-blue)] transition-colors hover:text-[var(--public-blue-deep)]">
              View chapter moments
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[var(--public-surface-subtle)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <SectionHeading
            align="center"
            eyebrow="Community impact"
            title="Service that meets Birmingham where it is"
            description="Our signature initiatives create moments of support, celebration, and opportunity for students, families, and neighbors throughout the year."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {INITIATIVES.map((initiative) => (
              <ImpactCard
                key={initiative.title}
                {...initiative}
                link={{ href: "/community-events", label: "Explore the initiative" }}
              />
            ))}
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
