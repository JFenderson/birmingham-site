import type { SanityImageSource } from "@sanity/image-url";

export type SanityImageWithAlt = SanityImageSource & {
  alt?: string | null;
};

export type SanityGalleryPhoto = SanityImageWithAlt & {
  caption?: string | null;
};

export interface SanityGallerySummary {
  _id: string;
  title: string;
  slug: string;
  eventDate: string;
  publishedAt: string;
  description: string;
  coverImage: SanityImageWithAlt | null;
  photos: SanityGalleryPhoto[];
}

export type SanityVideoProvider = "youtube" | "vimeo";

export interface SanityVideoSummary {
  _id: string;
  title: string;
  provider: SanityVideoProvider;
  url: string;
  publishedAt: string;
  description: string | null;
  thumbnail: SanityImageWithAlt | null;
}
