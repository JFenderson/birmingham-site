import { notFound } from "next/navigation";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { sanityClient } from "@/sanity/client";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";
import { getPublishedPostBySlug } from "@/sanity/queries";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";

const builder = createImageUrlBuilder(sanityClient);
function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

const portableTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="mt-4 text-[15px] leading-8 text-zinc-700">{children}</p>,
    h2: ({ children }) => <h2 className="mt-8 text-2xl font-semibold text-zinc-900">{children}</h2>,
  },
};

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { chapterSlug } = await getCurrentChapter();
  const post = await getPublishedPostBySlug(chapterSlug, slug);

  if (!post) notFound();

  const coverAlt = post.coverImage?.alt?.trim();

  return (
    <div className="bg-[#f8f9fc] px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-md border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
        {post.coverImage && coverAlt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={urlFor(post.coverImage).width(1600).fit("max").url()}
            alt={coverAlt}
            className="mb-6 max-h-[32rem] w-full rounded-md object-contain object-center"
          />
        ) : null}
        <h1 className="text-4xl font-bold text-[#013594] sm:text-5xl">{post.title}</h1>
        {post.publishedAt ? (
          <p className="mt-2 text-xs text-zinc-500">
            {new Date(post.publishedAt).toLocaleDateString()}
          </p>
        ) : null}
        <div className="mt-6">
          <PortableText value={post.body} components={portableTextComponents} />
        </div>
      </div>
    </div>
  );
}
