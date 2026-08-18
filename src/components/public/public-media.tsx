import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Images, PlayCircle } from "lucide-react";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
import type {
  SanityGalleryPhoto,
  SanityGallerySummary,
  SanityVideoProvider,
  SanityVideoSummary,
} from "@/sanity/media";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

const builder = createImageUrlBuilder({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? process.env.SANITY_PROJECT_ID ?? "test-project",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? process.env.SANITY_DATASET ?? "production",
});

function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

function getSanityImageUrl(source: SanityImageSource, width: number, height: number) {
  try {
    return urlFor(source).width(width).height(height).fit("crop").url();
  } catch {
    return null;
  }
}

function getMeaningfulImageAlt(image: { alt?: string | null }) {
  const alt = image.alt?.trim();
  return alt ? alt : null;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getVideoHostnames(provider: SanityVideoProvider) {
  return provider === "youtube"
    ? new Set(["youtube.com", "www.youtube.com", "youtu.be"])
    : new Set(["vimeo.com", "www.vimeo.com"]);
}

export function getSafeVideoHref(provider: SanityVideoProvider, url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    return getVideoHostnames(provider).has(parsed.hostname.toLowerCase()) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function getProviderLabel(provider: SanityVideoProvider) {
  return provider === "youtube" ? "YouTube" : "Vimeo";
}

interface PublicMediaEmptyStateProps {
  title: string;
  description: string;
  action?: {
    href: string;
    label: string;
  };
}

export function PublicMediaEmptyState({ title, description, action }: PublicMediaEmptyStateProps) {
  return (
    <section className="rounded-2xl border border-dashed border-[var(--public-border)] bg-[var(--public-surface)] px-6 py-10 text-center shadow-sm">
      <h2 className="font-[family-name:var(--public-font-display)] text-2xl font-bold tracking-tight text-[var(--public-ink)]">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--public-muted)]">{description}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--public-blue)] transition-colors hover:text-[var(--public-blue-deep)]"
        >
          {action.label}
          <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      ) : null}
    </section>
  );
}

interface PublicGalleryImageProps {
  photo: SanityGalleryPhoto;
  priority?: boolean;
}

function PublicGalleryImage({ photo, priority = false }: PublicGalleryImageProps) {
  const alt = getMeaningfulImageAlt(photo);
  if (!alt) return null;

  const imageUrl = getSanityImageUrl(photo, 1200, 900);

  return (
    <figure className="overflow-hidden rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface)] shadow-sm">
      <div className="relative aspect-[4/3] bg-[var(--public-surface-strong)]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={alt}
            fill
            unoptimized
            priority={priority}
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm font-medium text-[var(--public-muted)]">
            Photo unavailable
          </div>
        )}
      </div>
      {photo.caption?.trim() ? (
        <figcaption className="border-t border-[var(--public-border)] px-4 py-3 text-sm leading-6 text-[var(--public-muted)]">
          {photo.caption.trim()}
        </figcaption>
      ) : null}
    </figure>
  );
}

interface PublicPhotoGalleryListProps {
  galleries: SanityGallerySummary[];
}

export function PublicPhotoGalleryList({ galleries }: PublicPhotoGalleryListProps) {
  if (galleries.length === 0) {
    return (
      <PublicMediaEmptyState
        title="No chapter photos yet"
        description="Published chapter galleries will appear here once the first Sanity photo set is live."
      />
    );
  }

  return (
    <div className="space-y-10">
      {galleries.map((gallery) => {
        const photosWithAlt = gallery.photos.filter((photo) => getMeaningfulImageAlt(photo));

        return (
          <article
            key={gallery._id}
            id={gallery.slug}
            className="overflow-hidden rounded-[1.75rem] border border-[var(--public-border)] bg-[var(--public-surface)] shadow-sm"
          >
            <div className="border-b border-[var(--public-border)] bg-[var(--public-surface-subtle)] px-6 py-6 sm:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--public-blue)]">Photo gallery</p>
                  <h2 className="mt-3 font-[family-name:var(--public-font-display)] text-3xl font-bold tracking-tight text-[var(--public-ink)]">
                    {gallery.title}
                  </h2>
                  <p className="mt-3 text-sm font-medium text-[var(--public-muted)]">
                    Event date: <time dateTime={gallery.eventDate}>{formatDate(gallery.eventDate)}</time>
                  </p>
                  <p className="mt-4 text-sm leading-7 text-[var(--public-muted)]">{gallery.description}</p>
                </div>
                <p className="inline-flex items-center gap-2 rounded-full bg-[var(--public-surface)] px-4 py-2 text-sm font-semibold text-[var(--public-blue)]">
                  <Images aria-hidden="true" className="h-4 w-4" />
                  {photosWithAlt.length} photos
                </p>
              </div>
            </div>
            <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8 xl:grid-cols-3">
              {photosWithAlt.map((photo, photoIndex) => (
                <PublicGalleryImage
                  key={`${gallery._id}-photo-${photoIndex + 1}`}
                  photo={photo}
                  priority={photoIndex === 0}
                />
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

interface PublicGalleryOverviewProps {
  galleries: SanityGallerySummary[];
}

export function PublicGalleryOverview({ galleries }: PublicGalleryOverviewProps) {
  return (
    <section aria-labelledby="media-galleries-heading">
      <SectionHeading
        id="media-galleries-heading"
        title="Published photo galleries"
        eyebrow="Photo highlights"
        description="Browse the latest chapter galleries, then open the full photo page for every captioned image."
        className="max-w-4xl"
      />
      {galleries.length === 0 ? (
        <div className="mt-8">
          <PublicMediaEmptyState
            title="No public galleries yet"
            description="Once a chapter gallery is published in Sanity, it will appear here automatically."
            action={{ href: "/photos", label: "Visit the photo page" }}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {galleries.map((gallery) => {
            const coverAlt = gallery.coverImage ? getMeaningfulImageAlt(gallery.coverImage) : null;
            const coverImageUrl =
              gallery.coverImage && coverAlt ? getSanityImageUrl(gallery.coverImage, 1400, 875) : null;
            const photoCount = gallery.photos.filter((photo) => getMeaningfulImageAlt(photo)).length;

            return (
              <article
                key={gallery._id}
                className="overflow-hidden rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface)] shadow-sm"
              >
                {gallery.coverImage && coverAlt ? (
                  <div className="relative aspect-[16/10] bg-[var(--public-surface-strong)]">
                    {coverImageUrl ? (
                      <Image
                        src={coverImageUrl}
                        alt={coverAlt}
                        fill
                        unoptimized
                        sizes="(max-width: 1023px) 100vw, 50vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center text-sm font-medium text-[var(--public-muted)]">
                        Cover image unavailable
                      </div>
                    )}
                  </div>
                ) : null}
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--public-muted)]">
                    <span className="rounded-full bg-[var(--public-surface-subtle)] px-3 py-1 font-semibold text-[var(--public-blue)]">
                      {photoCount} photos
                    </span>
                    <time dateTime={gallery.eventDate}>{formatDate(gallery.eventDate)}</time>
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-[var(--public-ink)]">{gallery.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--public-muted)]">{gallery.description}</p>
                  <Link
                    href={`/photos#${gallery.slug}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--public-blue)] transition-colors hover:text-[var(--public-blue-deep)]"
                  >
                    Open this gallery
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

interface PublicVideoCardProps {
  video: SanityVideoSummary;
}

function PublicVideoCard({ video }: PublicVideoCardProps) {
  const safeHref = getSafeVideoHref(video.provider, video.url);
  const providerLabel = getProviderLabel(video.provider);
  const thumbnailAlt = video.thumbnail ? getMeaningfulImageAlt(video.thumbnail) : null;
  const thumbnailUrl = video.thumbnail && thumbnailAlt ? getSanityImageUrl(video.thumbnail, 1400, 788) : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--public-border)] bg-[var(--public-surface)] shadow-sm">
      {video.thumbnail && thumbnailAlt ? (
        <div className="relative aspect-video bg-[var(--public-surface-strong)]">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={thumbnailAlt}
              fill
              unoptimized
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm font-medium text-[var(--public-muted)]">
              Video thumbnail unavailable
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/10 to-transparent" />
          <div className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-full bg-white/92 px-3 py-1.5 text-sm font-semibold text-[var(--public-blue-deep)] shadow-sm">
            <PlayCircle aria-hidden="true" className="h-4 w-4" />
            {providerLabel}
          </div>
        </div>
      ) : null}
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--public-muted)]">
          <span className="rounded-full bg-[var(--public-surface-subtle)] px-3 py-1 font-semibold text-[var(--public-blue)]">
            {providerLabel}
          </span>
          <time dateTime={video.publishedAt}>{formatDate(video.publishedAt)}</time>
        </div>
        <h3 className="mt-4 text-2xl font-bold text-[var(--public-ink)]">{video.title}</h3>
        {video.description ? (
          <p className="mt-3 text-sm leading-7 text-[var(--public-muted)]">{video.description}</p>
        ) : null}
        {safeHref ? (
          <a
            href={safeHref}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--public-blue)] transition-colors hover:text-[var(--public-blue-deep)]"
          >
            Watch on {providerLabel}
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </a>
        ) : (
          <p className="mt-5 text-sm font-semibold text-[var(--public-muted)]">
            This video link is unavailable right now. Please check back soon.
          </p>
        )}
      </div>
    </article>
  );
}

interface PublicVideoOverviewProps {
  videos: SanityVideoSummary[];
  className?: string;
}

export function PublicVideoOverview({ videos, className }: PublicVideoOverviewProps) {
  return (
    <section aria-labelledby="media-videos-heading" className={cn(className)}>
      <SectionHeading
        id="media-videos-heading"
        title="Published chapter videos"
        eyebrow="Video spotlight"
        description="Open chapter speeches, recaps, and interviews through their original hosting platforms."
        className="max-w-4xl"
      />
      {videos.length === 0 ? (
        <div className="mt-8">
          <PublicMediaEmptyState
            title="No public videos yet"
            description="YouTube and Vimeo links will appear here after the chapter publishes its first video."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {videos.map((video) => (
            <PublicVideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </section>
  );
}
