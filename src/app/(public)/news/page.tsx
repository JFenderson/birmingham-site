import Link from "next/link";
import { sanityClient } from "@/sanity/client";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";
import { getPublishedPostSummaries } from "@/sanity/queries";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";

const builder = createImageUrlBuilder(sanityClient);
function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

export default async function NewsPage() {
  const { chapterSlug } = await getCurrentChapter();
  const posts = await getPublishedPostSummaries(chapterSlug);

  return (
    <div className="bg-[#f8f9fc] px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-[#013594] sm:text-5xl">News</h1>

        {posts.length === 0 ? (
          <p className="mt-8 text-sm text-zinc-600">No posts yet — check back soon.</p>
        ) : (
          <div className="mt-8 space-y-6">
            {posts.map((post) => {
              const coverAlt = post.coverImage?.alt?.trim();

              return (
                <Link
                  key={post._id}
                  href={`/news/${post.slug}`}
                  className="block rounded-md border border-zinc-200 bg-white p-6 shadow-sm transition-colors hover:border-[#0047AB]"
                >
                  {post.coverImage && coverAlt ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={urlFor(post.coverImage).width(1200).fit("max").url()}
                      alt={coverAlt}
                      className="mb-4 max-h-80 w-full rounded-md object-contain object-center"
                    />
                  ) : null}
                  <h2 className="text-xl font-semibold text-zinc-900">{post.title}</h2>
                  {post.publishedAt ? (
                    <p className="mt-1 text-xs text-zinc-500">
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </p>
                  ) : null}
                  {post.excerpt ? (
                    <p className="mt-3 text-sm leading-7 text-zinc-700">
                      {post.excerpt}
                      {post.excerpt.length >= 201 ? "…" : ""}
                    </p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
