import Link from "next/link";
import { ContentCta } from "@/components/public/content-cta";
import { PublicPhotoGalleryList } from "@/components/public/public-media";
import { SectionHeading } from "@/components/public/section-heading";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";
import { getPublishedGalleries } from "@/sanity/queries";

export default async function PhotosPage() {
  const chapter = await getCurrentChapter();
  const galleries = await getPublishedGalleries(chapter.chapterSlug);

  return (
    <>
      <section className="bg-[var(--public-surface-subtle)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <SectionHeading
            align="center"
            as="h1"
            eyebrow="Photo gallery"
            title={`${chapter.name} in motion`}
            description="Published chapter galleries appear here with accessible alt text, captions, and photo groupings from service, fellowship, and public events."
          />
          <div className="mt-8 flex justify-center">
            <Link
              href="/media"
              className="inline-flex items-center rounded-full border border-[var(--public-border)] bg-[var(--public-surface)] px-5 py-3 text-sm font-bold text-[var(--public-blue)] transition-colors hover:border-[var(--public-blue)] hover:text-[var(--public-blue-deep)]"
            >
              Browse photos and videos
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[var(--public-surface)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <PublicPhotoGalleryList galleries={galleries} />
        </div>
      </section>

      <section className="bg-[var(--public-surface-subtle)] py-16 sm:py-20">
        <div className="mx-auto max-w-[var(--public-content-max)] px-[var(--public-gutter)]">
          <ContentCta
            title="Need the chapter's video highlights too?"
            description="Visit the media page for published video links, thumbnails, and featured gallery shortcuts from the same chapter feed."
            action={{ href: "/media", label: "Open the media page" }}
            secondaryAction={{ href: "/contact", label: "Contact the chapter" }}
          />
        </div>
      </section>
    </>
  );
}
