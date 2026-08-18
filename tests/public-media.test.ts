import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  PublicGalleryOverview,
  PublicPhotoGalleryList,
  PublicVideoOverview,
} from "@/components/public/public-media";
import type { SanityGallerySummary, SanityVideoSummary } from "@/sanity/media";

const sampleGallery: SanityGallerySummary = {
  _id: "gallery-1",
  title: "Blue and White Weekend",
  slug: "blue-and-white-weekend",
  eventDate: "2026-07-15T00:00:00.000Z",
  publishedAt: "2026-07-20T00:00:00.000Z",
  description: "A weekend recap from chapter service and fellowship.",
  coverImage: {
    asset: { _ref: "image-1234567890abcdef1234567890abcdef12345678-1400x875-jpg" },
    alt: "Brothers standing together in blue and white attire",
  },
  photos: [
    {
      asset: { _ref: "image-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-1200x900-jpg" },
      alt: "Brothers organizing backpacks for students",
      caption: "Brothers preparing backpacks before the service project.",
    },
    {
      asset: { _ref: "image-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb-1200x900-jpg" },
      alt: "Chapter volunteers greeting families",
      caption: "Volunteers welcomed families throughout the afternoon.",
    },
  ],
};

const sampleVideo: SanityVideoSummary = {
  _id: "video-1",
  title: "Chapter president remarks",
  provider: "youtube",
  url: "https://www.youtube.com/watch?v=abc123",
  publishedAt: "2026-08-10T00:00:00.000Z",
  description: "A brief update on the chapter's service agenda.",
  thumbnail: {
    asset: { _ref: "image-cccccccccccccccccccccccccccccccccccccccc-1400x788-jpg" },
    alt: "Chapter president speaking at the podium",
  },
};

test("public photo gallery list renders Sanity alt text and captions", () => {
  const markup = renderToStaticMarkup(createElement(PublicPhotoGalleryList, { galleries: [sampleGallery] }));

  assert.match(markup, /Blue and White Weekend/);
  assert.match(markup, /Brothers organizing backpacks for students/);
  assert.match(markup, /Brothers preparing backpacks before the service project\./);
  assert.match(markup, /Volunteers welcomed families throughout the afternoon\./);
});

test("public media overviews render accessible empty states", () => {
  const galleryMarkup = renderToStaticMarkup(createElement(PublicGalleryOverview, { galleries: [] }));
  const videoMarkup = renderToStaticMarkup(createElement(PublicVideoOverview, { videos: [] }));

  assert.match(galleryMarkup, /<section[^>]*aria-labelledby="media-galleries-heading"/);
  assert.match(galleryMarkup, /<h2[^>]*id="media-galleries-heading"[^>]*>Published photo galleries<\/h2>/);
  assert.match(galleryMarkup, /<h2[^>]*>No public galleries yet<\/h2>/);
  assert.match(galleryMarkup, /Visit the photo page/);
  assert.match(videoMarkup, /<section[^>]*aria-labelledby="media-videos-heading"/);
  assert.match(videoMarkup, /<h2[^>]*id="media-videos-heading"[^>]*>Published chapter videos<\/h2>/);
  assert.match(videoMarkup, /<h2[^>]*>No public videos yet<\/h2>/);
  assert.match(videoMarkup, /YouTube and Vimeo links will appear here/);
});

test("public media omits images when Sanity alt text is blank", () => {
  const galleryWithBlankAlt: SanityGallerySummary = {
    ...sampleGallery,
    coverImage: {
      asset: { _ref: "image-1234567890abcdef1234567890abcdef12345678-1400x875-jpg" },
      alt: "   ",
    },
    photos: [
      {
        asset: { _ref: "image-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-1200x900-jpg" },
        alt: "   ",
        caption: "This unsafe photo should be omitted.",
      },
      sampleGallery.photos[1]!,
    ],
  };
  const videoWithBlankThumbnailAlt: SanityVideoSummary = {
    ...sampleVideo,
    thumbnail: {
      asset: { _ref: "image-cccccccccccccccccccccccccccccccccccccccc-1400x788-jpg" },
      alt: "\t",
    },
  };

  const listMarkup = renderToStaticMarkup(createElement(PublicPhotoGalleryList, { galleries: [galleryWithBlankAlt] }));
  const overviewMarkup = renderToStaticMarkup(createElement(PublicGalleryOverview, { galleries: [galleryWithBlankAlt] }));
  const videoMarkup = renderToStaticMarkup(createElement(PublicVideoOverview, { videos: [videoWithBlankThumbnailAlt] }));

  assert.doesNotMatch(listMarkup, /alt=""/);
  assert.doesNotMatch(listMarkup, /This unsafe photo should be omitted\./);
  assert.match(listMarkup, /Chapter volunteers greeting families/);
  assert.doesNotMatch(overviewMarkup, /alt=""/);
  assert.match(overviewMarkup, /Blue and White Weekend/);
  assert.doesNotMatch(videoMarkup, /alt=""/);
  assert.match(videoMarkup, /Chapter president remarks/);
});

test("public video overview renders safe provider links only", () => {
  const safeMarkup = renderToStaticMarkup(createElement(PublicVideoOverview, { videos: [sampleVideo] }));
  const vimeoMarkup = renderToStaticMarkup(
    createElement(PublicVideoOverview, {
      videos: [{ ...sampleVideo, _id: "video-3", provider: "vimeo", url: "https://vimeo.com/123456789" }],
    }),
  );
  const insecureVimeoMarkup = renderToStaticMarkup(
    createElement(PublicVideoOverview, {
      videos: [{ ...sampleVideo, _id: "video-4", provider: "vimeo", url: "http://vimeo.com/123456789" }],
    }),
  );
  const unsafeMarkup = renderToStaticMarkup(
    createElement(PublicVideoOverview, {
      videos: [{ ...sampleVideo, _id: "video-2", provider: "youtube", url: "https://example.com/watch?v=abc123" }],
    }),
  );

  assert.match(safeMarkup, /href="https:\/\/www\.youtube\.com\/watch\?v=abc123"/);
  assert.match(safeMarkup, /target="_blank"/);
  assert.match(safeMarkup, /rel="noreferrer"/);
  assert.match(safeMarkup, /Chapter president speaking at the podium/);
  assert.match(vimeoMarkup, /href="https:\/\/vimeo\.com\/123456789"/);
  assert.match(vimeoMarkup, /Watch on Vimeo/);
  assert.doesNotMatch(insecureVimeoMarkup, /href="http:\/\/vimeo\.com\/123456789"/);
  assert.match(insecureVimeoMarkup, /This video link is unavailable right now/);
  assert.doesNotMatch(unsafeMarkup, /href="https:\/\/example\.com\/watch\?v=abc123"/);
  assert.match(unsafeMarkup, /This video link is unavailable right now/);
});
