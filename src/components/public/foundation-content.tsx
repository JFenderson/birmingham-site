import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "@/sanity/client";
import { isSafeExternalUrl } from "@/lib/content-links";
import type {
  SanityFoundationBoardMember,
  SanityFoundationEvent,
  SanityFoundationProject,
  SanityFoundationSettings,
} from "@/sanity/queries";
import { SectionHeading } from "./section-heading";

const builder = createImageUrlBuilder(sanityClient);
function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

function getSafeAlt(image: { alt?: string | null } | null | undefined) {
  const alt = image?.alt?.trim();
  return alt ? alt : null;
}

/**
 * Gates the donation destination behind the same safe-URL check used for
 * other Sanity-managed external links (`isSafeExternalUrl`). Returns null
 * for missing/blank/unsafe values so callers can skip rendering a donate
 * link entirely rather than pointing at an unvetted destination. Donation
 * processing itself always happens on the external destination this URL
 * points to — this component never collects payment details.
 */
export function getSafeDonationHref(url: string | null | undefined): string | null {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return isSafeExternalUrl(trimmed) ? trimmed : null;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

interface FoundationEmptyStateProps {
  chapterName: string;
}

export function FoundationEmptyState({ chapterName }: FoundationEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--public-border)] bg-[var(--public-surface)] px-6 py-10 text-center shadow-sm">
      <h2 className="font-[family-name:var(--public-font-display)] text-2xl font-bold tracking-tight text-[var(--public-ink)]">
        Foundation details are coming soon.
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--public-muted)]">
        {chapterName} has not published Tau Sigma Charity Foundation content yet. Check back
        soon for our nonprofit overview, projects, and ways to get involved.
      </p>
    </div>
  );
}

interface FoundationHeroProps {
  settings: SanityFoundationSettings;
}

export function FoundationHero({ settings }: FoundationHeroProps) {
  const heroAlt = getSafeAlt(settings.heroImage);

  return (
    <div className="grid gap-10 lg:grid-cols-[3fr_2fr] lg:items-center">
      <div>
        <SectionHeading
          as="h1"
          eyebrow={settings.nonprofitName}
          title="Tau Sigma Charity Foundation"
          description={settings.overview}
        />
        <p className="mt-4 text-sm font-semibold text-[var(--public-muted)]">
          {settings.taxStatusStatement}
        </p>
      </div>
      {settings.heroImage && heroAlt ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={urlFor(settings.heroImage as SanityImageSource).width(800).height(560).fit("crop").url()}
          alt={heroAlt}
          className="w-full rounded-2xl object-cover shadow-[var(--public-shadow)]"
        />
      ) : null}
    </div>
  );
}

interface FoundationPurposeProps {
  purpose: string;
}

export function FoundationPurpose({ purpose }: FoundationPurposeProps) {
  return (
    <SectionHeading eyebrow="Our purpose" title="Why the foundation exists" description={purpose} />
  );
}

interface FoundationDonationSectionProps {
  donationUrl: string;
}

export function FoundationDonationSection({ donationUrl }: FoundationDonationSectionProps) {
  const href = getSafeDonationHref(donationUrl);

  return (
    <div>
      <SectionHeading
        eyebrow="Support the mission"
        title="Make a donation"
        description="Donations are processed securely by our external giving partner. You'll leave this site to complete your gift."
      />
      {href ? (
        <a
          href={href}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--public-blue)] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--public-blue-deep)]"
        >
          Donate now
        </a>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-[var(--public-border)] bg-[var(--public-surface)] px-6 py-8 text-center text-sm text-[var(--public-muted)]">
          Online donations are not currently available. Please use the contact information below
          to give.
        </p>
      )}
    </div>
  );
}

interface FoundationProjectsSectionProps {
  projects: SanityFoundationProject[];
}

export function FoundationProjectsSection({ projects }: FoundationProjectsSectionProps) {
  return (
    <div>
      <SectionHeading
        eyebrow="Our impact"
        title="Past projects"
        description="Community initiatives funded and led by the foundation."
      />
      {projects.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-[var(--public-border)] bg-[var(--public-surface)] px-6 py-8 text-center text-sm text-[var(--public-muted)]">
          No projects have been published yet — check back soon.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const imageAlt = getSafeAlt(project.image);

            return (
              <article
                key={project._id}
                className="overflow-hidden rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface)] shadow-sm"
              >
                {project.image && imageAlt ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={urlFor(project.image as SanityImageSource).width(640).height(360).fit("crop").url()}
                    alt={imageAlt}
                    className="h-40 w-full object-cover"
                  />
                ) : null}
                <div className="p-6">
                  <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--public-blue)]">
                    {project.projectType}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-[var(--public-ink)]">{project.title}</h3>
                  <p className="mt-1 text-sm text-[var(--public-muted)]">{formatDate(project.date)}</p>
                  <p className="mt-3 text-sm leading-7 text-[var(--public-muted)]">
                    {project.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface FoundationEventsSectionProps {
  events: SanityFoundationEvent[];
}

export function FoundationEventsSection({ events }: FoundationEventsSectionProps) {
  return (
    <div>
      <SectionHeading
        eyebrow="What's next"
        title="Foundation events"
        description="Fundraisers, community service, and outreach hosted by the foundation."
      />
      {events.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-[var(--public-border)] bg-[var(--public-surface)] px-6 py-8 text-center text-sm text-[var(--public-muted)]">
          No upcoming events yet — check back soon.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const canRegister =
              typeof event.registrationUrl === "string" &&
              event.registrationUrl.trim().length > 0 &&
              isSafeExternalUrl(event.registrationUrl);

            return (
              <article
                key={event._id}
                className="overflow-hidden rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface)] p-6 shadow-sm"
              >
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--public-blue)]">
                  {formatDate(event.date)}
                </p>
                <h3 className="mt-2 text-xl font-bold text-[var(--public-ink)]">{event.title}</h3>
                <p className="mt-2 text-sm text-[var(--public-muted)]">{event.location}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--public-muted)]">
                  {event.description}
                </p>
                {canRegister ? (
                  <a
                    href={event.registrationUrl as string}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--public-blue)] transition-colors hover:text-[var(--public-blue-deep)]"
                  >
                    Register
                  </a>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface FoundationBoardSectionProps {
  boardMembers: SanityFoundationBoardMember[];
}

export function FoundationBoardSection({ boardMembers }: FoundationBoardSectionProps) {
  if (boardMembers.length === 0) return null;

  return (
    <div>
      <SectionHeading eyebrow="Meet the team" title="Board of directors" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {boardMembers.map((member) => {
          const portraitAlt = getSafeAlt(member.portrait);

          return (
            <article
              key={member._id}
              className="overflow-hidden rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface)] shadow-sm"
            >
              {member.portrait && portraitAlt ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={urlFor(member.portrait as SanityImageSource).width(480).height(480).fit("crop").url()}
                  alt={portraitAlt}
                  className="h-48 w-full object-cover"
                />
              ) : null}
              <div className="p-6">
                <h3 className="text-lg font-bold text-[var(--public-ink)]">{member.name}</h3>
                <p className="mt-1 text-sm font-semibold text-[var(--public-blue)]">{member.role}</p>
                {member.bio ? (
                  <p className="mt-3 text-sm leading-7 text-[var(--public-muted)]">{member.bio}</p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
