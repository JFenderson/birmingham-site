import {
  FoundationBoardSection,
  FoundationDonationSection,
  FoundationEmptyState,
  FoundationEventsSection,
  FoundationHero,
  FoundationProjectsSection,
  FoundationPurpose,
} from "@/components/public/foundation-content";
import { FoundationInformationForm } from "@/components/public/foundation-information-form";
import { SectionHeading } from "@/components/public/section-heading";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";
import {
  getFoundationBoardMembers,
  getFoundationEvents,
  getFoundationProjects,
  getFoundationSettings,
} from "@/sanity/queries";

export default async function FoundationPage() {
  const chapter = await getCurrentChapter();
  const [settings, projects, events, boardMembers] = await Promise.all([
    getFoundationSettings(chapter.chapterSlug),
    getFoundationProjects(chapter.chapterSlug),
    getFoundationEvents(chapter.chapterSlug),
    getFoundationBoardMembers(chapter.chapterSlug),
  ]);

  if (!settings) {
    return (
      <section className="bg-[var(--public-surface-subtle)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <FoundationEmptyState chapterName={chapter.name} />
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-[var(--public-surface-subtle)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <FoundationHero settings={settings} />
        </div>
      </section>

      <section className="bg-[var(--public-surface)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <FoundationPurpose purpose={settings.purpose} />
        </div>
      </section>

      <section className="bg-[var(--public-surface-subtle)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <FoundationDonationSection donationUrl={settings.donationUrl} />
        </div>
      </section>

      <section className="bg-[var(--public-surface)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <FoundationProjectsSection projects={projects} />
        </div>
      </section>

      <section className="bg-[var(--public-surface-subtle)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <FoundationEventsSection events={events} />
        </div>
      </section>

      <section className="bg-[var(--public-surface)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <FoundationBoardSection boardMembers={boardMembers} />
        </div>
      </section>

      <section className="bg-[var(--public-surface-subtle)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <SectionHeading
            eyebrow="Get in touch"
            title="Request more information"
            description={settings.infoRequestIntro}
          />
          <div className="mt-8 max-w-2xl">
            <FoundationInformationForm />
          </div>
          <p className="mt-6 text-sm text-[var(--public-muted)]">
            Prefer email?{" "}
            <a
              href={`mailto:${settings.contactEmail}`}
              className="font-semibold text-[var(--public-blue)] hover:text-[var(--public-blue-deep)]"
            >
              {settings.contactEmail}
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
