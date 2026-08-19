import Link from "next/link";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
import { getSafeImageAlt, resolveLeadershipContent } from "@/lib/public-content";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";
import { sanityClient } from "@/sanity/client";
import { getPublishedLeadershipPageLeaders } from "@/sanity/queries";

const builder = createImageUrlBuilder(sanityClient);

function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

export default async function AboutLeadershipPage() {
  const chapter = await getCurrentChapter();
  const cmsLeaders = await getPublishedLeadershipPageLeaders(chapter.chapterSlug);
  const content = resolveLeadershipContent(cmsLeaders, {
    chapterName: chapter.name,
    chapterSlug: chapter.chapterSlug,
  });

  return (
    <div className="bg-white px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-md border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
        <h1 className="text-4xl font-bold text-[#013594] sm:text-5xl">Leadership</h1>
        <p className="mt-4 text-[15px] leading-8 text-zinc-700">
          Tau Sigma leadership is committed to service-driven planning, chapter accountability, and member development.
        </p>

        {content.status === "empty" ? (
          <div className="mt-8 rounded-md border border-dashed border-zinc-300 bg-[#f8f9fc] p-6">
            <p className="text-sm leading-7 text-zinc-700">{content.message}</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {content.leaders.map((leader) => {
              const portraitAlt = getSafeImageAlt(leader.portrait);

              return (
                <article
                  key={leader._id}
                  className="rounded-md border border-zinc-200 bg-[#f8f9fc] p-4"
                >
                  {leader.portrait && portraitAlt ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={urlFor(leader.portrait).width(480).height(480).url()}
                      alt={portraitAlt}
                      className="mb-4 h-40 w-full rounded-md object-cover"
                    />
                  ) : null}
                  <p className="font-semibold text-zinc-900">{leader.name}</p>
                  <p className="text-sm text-zinc-600">{leader.role}</p>
                  {leader.bio ? (
                    <p className="mt-3 text-sm leading-7 text-zinc-700">{leader.bio}</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}

        <Link href="/about" className="mt-8 inline-flex rounded-full bg-[#0047AB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003b8e]">
          Back to About
        </Link>
      </div>
    </div>
  );
}
