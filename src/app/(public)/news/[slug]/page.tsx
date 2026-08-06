import { notFound } from "next/navigation";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { sanityClient } from "@/sanity/client";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";

interface PostDetail {
  _id: string;
  title: string;
  publishedAt: string | null;
  coverImage: SanityImageSource | null;
  body: unknown;
}

const builder = imageUrlBuilder(sanityClient);
function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

async function getPost(chapterSlug: string, slug: string): Promise<PostDetail | null> {
  return sanityClient.fetch(
    `*[_type == "post" && chapterSlug == $chapterSlug && slug.current == $slug][0] {
      _id, title, publishedAt, coverImage, body
    }`,
    { chapterSlug, slug }
  );
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
  const post = await getPost(chapterSlug, slug);

  if (!post) notFound();

  return (
    <div className="bg-[#f8f9fc] px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-md border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={urlFor(post.coverImage).width(1200).height(480).url()}
            alt=""
            className="mb-6 h-64 w-full rounded-md object-cover"
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
