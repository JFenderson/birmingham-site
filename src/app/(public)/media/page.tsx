import { ContentCta } from "@/components/public/content-cta";
import { PublicGalleryOverview, PublicVideoOverview } from "@/components/public/public-media";
import { SectionHeading } from "@/components/public/section-heading";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";
import { getPublishedGalleries, getPublishedVideos } from "@/sanity/queries";

export default async function MediaPage() {
  const chapter = await getCurrentChapter();
  const [galleries, videos] = await Promise.all([
    getPublishedGalleries(chapter.chapterSlug),
    getPublishedVideos(chapter.chapterSlug),
  ]);

  return (
    <>
      <section className="bg-[var(--public-surface-subtle)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <SectionHeading
            align="center"
            as="h1"
            eyebrow="Public media"
            title={`${chapter.name} galleries and videos`}
            description="Explore published chapter moments across photo galleries and trusted external video platforms, all filtered to the active chapter site."
          />
        </div>
      </section>

      <section className="bg-[var(--public-surface)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <PublicGalleryOverview galleries={galleries} />
        </div>
      </section>

      <section className="bg-[var(--public-surface-subtle)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <PublicVideoOverview videos={videos} />
        </div>
      </section>

      <section className="bg-[var(--public-surface)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <ContentCta
            title="Looking for the full photo archive?"
            description="Open the dedicated photo page for complete captioned gallery sets from the chapter's published Sanity collection."
            action={{ href: "/photos", label: "View all photos" }}
            secondaryAction={{ href: "/community-events", label: "See community events" }}
          />
        </div>
      </section>
    </>
  );
}
