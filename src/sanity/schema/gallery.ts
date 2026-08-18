import { defineArrayMember, defineField, defineType } from "sanity";
import {
  createAccessibleImageField,
  createChapterSlugField,
  createPublishedAtField,
  createPublishedField,
} from "./shared.ts";

export const gallery = defineType({
  name: "gallery",
  title: "Gallery",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      description: "Public gallery title shown on the media page.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      description: "URL-friendly label for this gallery.",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    createChapterSlugField("gallery"),
    createPublishedField("gallery"),
    createPublishedAtField("gallery"),
    defineField({
      name: "eventDate",
      title: "Event date",
      type: "date",
      description: "Date the photos were taken or the event happened.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 4,
      description: "Short introduction for the gallery page or card.",
      validation: (rule) => rule.required(),
    }),
    createAccessibleImageField(
      "coverImage",
      "Cover image",
      "Image used to represent this gallery on listing pages.",
      { required: true },
    ),
    defineField({
      name: "photos",
      title: "Photos",
      type: "array",
      description: "Ordered gallery images with captions and required alt text.",
      of: [
        defineArrayMember({
          name: "galleryPhoto",
          title: "Gallery photo",
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "caption",
              title: "Caption",
              type: "string",
              description: "Optional public caption shown with the photo.",
            }),
            defineField({
              name: "alt",
              title: "Alt text",
              type: "string",
              description: "Describe the image for people who cannot see it.",
              validation: (rule) => rule.required(),
            }),
          ],
          validation: (rule) =>
            rule.custom((value) => {
              const photo = value as { asset?: { _ref?: string }; alt?: string } | null;

              if (!photo?.asset?._ref) {
                return "Upload a photo.";
              }

              if (typeof photo.alt !== "string" || photo.alt.trim().length === 0) {
                return "Alt text is required for every public image.";
              }

              return true;
            }),
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
  ],
});
