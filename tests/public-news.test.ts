import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { SanityPostDetail, SanityPostSummary } from "../src/sanity/queries.ts";

process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= "test-project";

let postSummaries: SanityPostSummary[] = [];
let postDetail: SanityPostDetail | null = null;

mock.module("@/lib/tenant/get-chapter", {
  namedExports: {
    async getCurrentChapter() {
      return { chapterSlug: "miles" };
    },
  },
});

mock.module("@/sanity/queries", {
  namedExports: {
    async getPublishedPostSummaries() {
      return postSummaries;
    },
    async getPublishedPostBySlug() {
      return postDetail;
    },
  },
});

mock.module("@/sanity/client", {
  namedExports: {
    sanityClient: {},
  },
});

const meaningfulCover = {
  asset: { _ref: "image-1234567890abcdef1234567890abcdef12345678-1200x800-jpg" },
  alt: "Chapter members serving families",
};

async function renderNewsPage() {
  const { default: NewsPage } = await import("../src/app/(public)/news/page.tsx");

  return renderToStaticMarkup(await NewsPage());
}

async function renderNewsPostPage(slug = "community-cookout") {
  const { default: NewsPostPage } = await import("../src/app/(public)/news/[slug]/page.tsx");

  return renderToStaticMarkup(await NewsPostPage({ params: Promise.resolve({ slug }) }));
}

function sampleSummary(overrides: Partial<SanityPostSummary> = {}): SanityPostSummary {
  return {
    _id: "post-1",
    title: "Community Cookout",
    slug: "community-cookout",
    publishedAt: "2026-08-01T12:00:00.000Z",
    coverImage: meaningfulCover,
    excerpt: "The chapter hosted neighbors for an afternoon cookout.",
    ...overrides,
  };
}

function sampleDetail(overrides: Partial<SanityPostDetail> = {}): SanityPostDetail {
  return {
    _id: "post-1",
    title: "Community Cookout",
    slug: "community-cookout",
    publishedAt: "2026-08-01T12:00:00.000Z",
    coverImage: meaningfulCover,
    gallery: [],
    body: [{ _type: "block", children: [{ _type: "span", text: "Story" }] }],
    ...overrides,
  };
}

test("news list omits cover images when alt text is missing or blank", async () => {
  const coverWithoutAlt = { asset: meaningfulCover.asset };
  postSummaries = [
    sampleSummary({ _id: "post-missing-alt", title: "Missing Alt", coverImage: coverWithoutAlt }),
    sampleSummary({ _id: "post-blank-alt", title: "Blank Alt", coverImage: { ...meaningfulCover, alt: "   " } }),
  ];

  const markup = await renderNewsPage();

  assert.match(markup, /Missing Alt/);
  assert.match(markup, /Blank Alt/);
  assert.doesNotMatch(markup, /<img\b/);
  assert.doesNotMatch(markup, /alt=""/);
});

test("news list stays text-only even when a cover image exists", async () => {
  postSummaries = [sampleSummary()];

  const markup = await renderNewsPage();

  assert.doesNotMatch(markup, /<img\b/);
});

test("news detail omits the cover image when alt text is missing or blank", async () => {
  postDetail = sampleDetail({ coverImage: { ...meaningfulCover, alt: "\t" } });

  const markup = await renderNewsPostPage();

  assert.match(markup, /Community Cookout/);
  assert.doesNotMatch(markup, /<img\b/);
  assert.doesNotMatch(markup, /alt=""/);
});

test("news detail renders the cover image when alt text is meaningful", async () => {
  postDetail = sampleDetail();

  const markup = await renderNewsPostPage();

  assert.match(markup, /<img\b/);
  assert.match(markup, /alt="Chapter members serving families"/);
});

test("news detail renders a multi-photo gallery with captions", async () => {
  postDetail = sampleDetail({
    gallery: [
      { ...meaningfulCover, alt: "First chapter photo", caption: "Opening remarks" },
      { ...meaningfulCover, alt: "Second chapter photo", caption: "Fellowship afterward" },
    ],
  });

  const markup = await renderNewsPostPage();

  assert.match(markup, /First chapter photo/);
  assert.match(markup, /Second chapter photo/);
  assert.match(markup, /Opening remarks/);
  assert.match(markup, /Fellowship afterward/);
});
