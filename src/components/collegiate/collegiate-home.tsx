import { GraduationCap, HandHeart, Users } from "lucide-react";

import { CollegiateShell } from "./collegiate-shell";
import { ContentCta } from "@/components/public/content-cta";
import { Hero } from "@/components/public/hero";
import { ImpactCard } from "@/components/public/impact-card";
import { SectionHeading } from "@/components/public/section-heading";
import type { SiteContext } from "@/lib/tenant/site-context";

interface CollegiateHomeContent {
  description: string;
  introduction: string;
  highlights: ReadonlyArray<{
    title: string;
    description: string;
    href: string;
    linkLabel: string;
  }>;
}

interface CollegiateHomeProps {
  chapter: SiteContext;
  content?: CollegiateHomeContent;
}

const PRINCIPLES = [
  {
    icon: Users,
    title: "Brotherhood",
    description: "Build lifelong bonds through fellowship, accountability, and shared purpose.",
  },
  {
    icon: GraduationCap,
    title: "Scholarship",
    description: "Pursue academic excellence and prepare members to lead with confidence.",
  },
  {
    icon: HandHeart,
    title: "Service",
    description: "Create meaningful impact on campus and throughout the surrounding community.",
  },
] as const;

const DEFAULT_CONTENT: CollegiateHomeContent = {
  description: "Advancing brotherhood, scholarship, and service on campus and in the surrounding community.",
  introduction: "Our chapter develops principled leaders through academic achievement, fellowship, and service for humanity.",
  highlights: [
    {
      title: "Meet the chapter",
      description: "Learn about our chapter story, leadership, and commitment to Phi Beta Sigma.",
      href: "/about",
      linkLabel: "About the chapter",
    },
    {
      title: "News and events",
      description: "Find chapter announcements, upcoming programs, and opportunities to participate.",
      href: "/news",
      linkLabel: "View chapter news",
    },
    {
      title: "Connect with us",
      description: "Reach the chapter for membership information, partnerships, and general questions.",
      href: "/contact",
      linkLabel: "Contact the chapter",
    },
  ],
};

export function CollegiateHome({ chapter, content = DEFAULT_CONTENT }: CollegiateHomeProps) {
  return (
    <CollegiateShell chapter={chapter}>
      <Hero
        eyebrow="Phi Beta Sigma Fraternity, Inc."
        title={chapter.name}
        description={content.description}
        primaryAction={{ href: "/about", label: "Discover our chapter" }}
        secondaryAction={{ href: "/contact", label: "Connect with us" }}
      />

      <section className="bg-[var(--public-surface)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <SectionHeading
            align="center"
            eyebrow="Our foundation"
            title="Culture for service, service for humanity"
            description={content.introduction}
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PRINCIPLES.map(({ icon: Icon, title, description }) => (
              <ImpactCard
                key={title}
                title={title}
                description={description}
                icon={<Icon className="h-5 w-5" />}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--public-surface-subtle)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <SectionHeading
            align="center"
            eyebrow="Chapter life"
            title={`Explore ${chapter.name}`}
            description="Chapter-specific updates appear here as they are published."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {content.highlights.map((item) => (
              <ImpactCard
                key={item.title}
                title={item.title}
                description={item.description}
                link={{ href: item.href, label: item.linkLabel }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--public-surface)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <ContentCta
            title={`Connect with ${chapter.name}`}
            description="Contact the chapter for membership information, campus partnerships, and service opportunities."
            action={{ href: "/contact", label: "Contact the chapter" }}
            secondaryAction={{ href: "/news", label: "Read chapter news" }}
          />
        </div>
      </section>
    </CollegiateShell>
  );
}

export type { CollegiateHomeContent, CollegiateHomeProps };
