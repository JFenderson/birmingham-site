import Link from "next/link";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
import { getSafeImageAlt, resolvePastPresidentsContent } from "@/lib/public-content";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";
import { sanityClient } from "@/sanity/client";
import { getPublishedPastPresidents } from "@/sanity/queries";

const builder = createImageUrlBuilder(sanityClient);

function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

function hasImageAsset(source: SanityImageSource | null | undefined): source is SanityImageSource & {
  asset: { _ref?: string; _id?: string };
} {
  if (!source || typeof source !== "object" || !("asset" in source)) return false;

  const asset = source.asset;
  return Boolean(asset && typeof asset === "object" && ("_ref" in asset || "_id" in asset));
}

export default async function AboutPastPresidentsPage() {
  const { chapterSlug } = await getCurrentChapter();
  const presidents = await getPublishedPastPresidents(chapterSlug);
  const content = resolvePastPresidentsContent(presidents);

  return (
    <div className="bg-white px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-md border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
        <h1 className="text-4xl font-bold text-[#013594] sm:text-5xl">Past Presidents</h1>
        {content.status === "empty" ? (
          <ul className="mt-6 list-disc space-y-2 pl-5 text-[15px] leading-8 text-zinc-700">
            {content.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {content.presidents.map((president) => {
              const portraitAlt = getSafeImageAlt(president.portrait);

              return (
                <article
                  key={president._id}
                  className="rounded-md border border-zinc-200 bg-[#f8f9fc] p-4"
                >
                  {hasImageAsset(president.portrait) && portraitAlt ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={urlFor(president.portrait).width(480).height(480).url()}
                      alt={portraitAlt}
                      className="mb-4 h-40 w-full rounded-md object-cover"
                    />
                  ) : null}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-900">{president.name}</p>
                      <p className="text-sm text-zinc-600">{president.yearsServed}</p>
                    </div>
                    {president.featured ? (
                      <span className="rounded-full bg-[#e8f0ff] px-2.5 py-1 text-xs font-semibold text-[#013594]">
                        Featured
                      </span>
                    ) : null}
                  </div>
                  {president.bio ? (
                    <p className="mt-3 text-sm leading-7 text-zinc-700">{president.bio}</p>
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
