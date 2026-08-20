import { isSafeExternalUrl } from "@/lib/content-links";
import { getSanityImageUrl } from "@/sanity/image-url";
import type {
  SanitySigmaBetaAdvisor,
  SanitySigmaBetaDirectorContact,
  SanitySigmaBetaEvent,
} from "@/sanity/queries";
import { SectionHeading } from "./section-heading";

function getSafeAlt(image: { alt?: string | null } | null | undefined) {
  const alt = image?.alt?.trim();
  return alt ? alt : null;
}

function formatEventDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

interface SigmaBetaEmptyStateProps {
  chapterName: string;
}

export function SigmaBetaEmptyState({ chapterName }: SigmaBetaEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--public-border)] bg-[var(--public-surface)] px-6 py-10 text-center shadow-sm">
      <h2 className="font-[family-name:var(--public-font-display)] text-2xl font-bold tracking-tight text-[var(--public-ink)]">
        Sigma Beta Club details are coming soon.
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--public-muted)]">
        {chapterName} has not published Sigma Beta Club content yet. Check back soon for
        program details, upcoming events, and advisor contacts.
      </p>
    </div>
  );
}

interface SigmaBetaHeroProps {
  chapterName: string;
  overview: string;
  heroImage: { alt?: string | null } | null;
}

export function SigmaBetaHero({ chapterName, overview, heroImage }: SigmaBetaHeroProps) {
  const heroAlt = getSafeAlt(heroImage);
  const heroImageUrl = heroImage && heroAlt ? getSanityImageUrl(heroImage, 800, 560) : null;

  return (
    <div className="grid gap-10 lg:grid-cols-[3fr_2fr] lg:items-center">
      <div>
        <SectionHeading
          as="h1"
          eyebrow="Sigma Beta Club"
          title={`${chapterName} Sigma Beta Club`}
          description={overview}
        />
      </div>
      {heroImageUrl && heroAlt ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={heroImageUrl}
          alt={heroAlt}
          className="w-full rounded-2xl object-cover shadow-[var(--public-shadow)]"
        />
      ) : null}
    </div>
  );
}

interface SigmaBetaMissionProps {
  mission: string;
}

export function SigmaBetaMission({ mission }: SigmaBetaMissionProps) {
  return (
    <SectionHeading eyebrow="Our mission" title="What the Sigma Beta Club stands for" description={mission} />
  );
}

interface SigmaBetaEventsSectionProps {
  events: SanitySigmaBetaEvent[];
}

export function SigmaBetaEventsSection({ events }: SigmaBetaEventsSectionProps) {
  return (
    <div>
      <SectionHeading
        eyebrow="What's next"
        title="Upcoming events"
        description="Sigma Beta Club activities, workshops, and community service opportunities."
      />
      {events.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-[var(--public-border)] bg-[var(--public-surface)] px-6 py-8 text-center text-sm text-[var(--public-muted)]">
          No upcoming events yet — check back soon.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const imageAlt = getSafeAlt(event.image);
            const imageUrl = event.image && imageAlt ? getSanityImageUrl(event.image, 640, 360) : null;
            const canRegister =
              typeof event.registrationUrl === "string" &&
              event.registrationUrl.trim().length > 0 &&
              isSafeExternalUrl(event.registrationUrl);

            return (
              <article
                key={event._id}
                className="overflow-hidden rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface)] shadow-sm"
              >
                {imageUrl && imageAlt ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={imageAlt}
                    className="h-40 w-full object-cover"
                  />
                ) : null}
                <div className="p-6">
                  <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--public-blue)]">
                    {formatEventDate(event.eventDate)}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-[var(--public-ink)]">{event.title}</h3>
                  <p className="mt-2 text-sm text-[var(--public-muted)]">{event.location}</p>
                  <p className="mt-3 text-sm leading-7 text-[var(--public-muted)]">{event.description}</p>
                  {canRegister ? (
                    <a
                      href={event.registrationUrl as string}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--public-blue)] transition-colors hover:text-[var(--public-blue-deep)]"
                    >
                      Register
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface SigmaBetaDirectorContactSectionProps {
  contact: SanitySigmaBetaDirectorContact | null;
}

export function SigmaBetaDirectorContactSection({ contact }: SigmaBetaDirectorContactSectionProps) {
  if (!contact) return null;

  return (
    <div>
      <SectionHeading eyebrow="Reach the director" title="Program director contact" />
      <div className="mt-8 rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface)] p-6 shadow-sm">
        <p className="text-lg font-bold text-[var(--public-ink)]">{contact.label}</p>
        <p className="mt-2 text-sm text-[var(--public-muted)]">
          <a href={`mailto:${contact.email}`} className="font-semibold text-[var(--public-blue)] hover:text-[var(--public-blue-deep)]">
            {contact.email}
          </a>
        </p>
        {contact.phone ? <p className="mt-1 text-sm text-[var(--public-muted)]">{contact.phone}</p> : null}
      </div>
    </div>
  );
}

interface SigmaBetaAdvisorsSectionProps {
  advisors: SanitySigmaBetaAdvisor[];
}

export function SigmaBetaAdvisorsSection({ advisors }: SigmaBetaAdvisorsSectionProps) {
  if (advisors.length === 0) return null;

  return (
    <div>
      <SectionHeading eyebrow="Meet the team" title="Club advisors" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {advisors.map((advisor) => {
          const portraitAlt = getSafeAlt(advisor.portrait);
          const portraitUrl =
            advisor.portrait && portraitAlt ? getSanityImageUrl(advisor.portrait, 480, 480) : null;

          return (
            <article
              key={advisor.name}
              className="overflow-hidden rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface)] shadow-sm"
            >
              {portraitUrl && portraitAlt ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={portraitUrl}
                  alt={portraitAlt}
                  className="h-48 w-full object-cover"
                />
              ) : null}
              <div className="p-6">
                <h3 className="text-lg font-bold text-[var(--public-ink)]">{advisor.name}</h3>
                <p className="mt-1 text-sm font-semibold text-[var(--public-blue)]">{advisor.role}</p>
                {advisor.bio ? (
                  <p className="mt-3 text-sm leading-7 text-[var(--public-muted)]">{advisor.bio}</p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
