import type { Metadata } from "next";
import {
  SigmaBetaAdvisorsSection,
  SigmaBetaDirectorContactSection,
  SigmaBetaEmptyState,
  SigmaBetaEventsSection,
  SigmaBetaHero,
  SigmaBetaMission,
  SigmaBetaProgramsSection,
} from "@/components/public/sigma-beta-club-content";
import { SigmaBetaInterestForm } from "@/components/public/sigma-beta-interest-form";
import { SectionHeading } from "@/components/public/section-heading";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";
import { getSigmaBetaEvents, getSigmaBetaSettings } from "@/sanity/queries";

export const metadata: Metadata = {
  title: "Sigma Beta Club",
  description:
    "Learn about the Sigma Beta Club mentoring program, upcoming events, and how to get involved with the chapter's youth initiative.",
};

export default async function SigmaBetaClubPage() {
  const chapter = await getCurrentChapter();
  const [settings, events] = await Promise.all([
    getSigmaBetaSettings(chapter.chapterSlug),
    getSigmaBetaEvents(chapter.chapterSlug),
  ]);

  if (!settings) {
    return (
      <section className="bg-[var(--public-surface-subtle)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <SigmaBetaEmptyState chapterName={chapter.name} />
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-[var(--public-surface-subtle)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <SigmaBetaHero chapterName={chapter.name} overview={settings.overview} heroImage={settings.heroImage} />
        </div>
      </section>

      <section className="bg-[var(--public-surface)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <SigmaBetaMission mission={settings.mission} />
        </div>
      </section>

      <section className="bg-[var(--public-surface-subtle)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <SigmaBetaProgramsSection />
        </div>
      </section>

      <section className="bg-[var(--public-surface-subtle)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <SigmaBetaEventsSection events={events} />
        </div>
      </section>

      <section className="bg-[var(--public-surface)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <SectionHeading
            eyebrow="Get involved"
            title="Tell us about your interest"
            description={settings.interestFormIntro}
          />
          <div className="mt-8 max-w-2xl">
            <SigmaBetaInterestForm />
          </div>
        </div>
      </section>

      <section className="bg-[var(--public-surface-subtle)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <SigmaBetaDirectorContactSection contact={settings.directorContact} />
        </div>
      </section>

      <section className="bg-[var(--public-surface)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <SigmaBetaAdvisorsSection advisors={settings.advisors} />
        </div>
      </section>
    </>
  );
}
