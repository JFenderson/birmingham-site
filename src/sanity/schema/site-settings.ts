import { defineField, defineType } from "sanity";
import {
  createAccessibleImageField,
  createChapterSlugField,
  createPublishedAtField,
  createPublishedField,
} from "./shared.ts";

const linkFields = [
  defineField({
    name: "href",
    title: "Link URL",
    type: "string",
    description: "Use a site path such as /about or a full HTTPS URL.",
    validation: (rule) => rule.required(),
  }),
  defineField({
    name: "label",
    title: "Link label",
    type: "string",
    validation: (rule) => rule.required(),
  }),
];

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    createChapterSlugField("site settings document"),
    createPublishedField("site settings document"),
    createPublishedAtField("site settings document"),
    defineField({
      name: "hero",
      title: "Homepage hero",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", type: "string" }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "description", type: "text", rows: 3 }),
        defineField({ name: "primaryAction", title: "Primary action", type: "object", fields: linkFields }),
        defineField({ name: "secondaryAction", title: "Secondary action", type: "object", fields: linkFields }),
        createAccessibleImageField(
          "image",
          "Hero image",
          "Optional public homepage hero image. Add alt text whenever an image is uploaded.",
        ),
      ],
    }),
    defineField({
      name: "communityImpact",
      title: "Community impact",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", type: "string" }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "description", type: "text", rows: 3 }),
        defineField({
          name: "initiatives",
          title: "Initiatives",
          type: "array",
          of: [
            defineField({
              name: "initiative",
              title: "Initiative",
              type: "object",
              fields: [
                defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
                defineField({ name: "description", type: "text", rows: 3, validation: (rule) => rule.required() }),
                defineField({ name: "link", title: "Link", type: "object", fields: linkFields }),
                createAccessibleImageField(
                  "image",
                  "Image",
                  "Optional public initiative image. Add alt text whenever an image is uploaded.",
                ),
              ],
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "featuredPresident",
      title: "Featured president content",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", type: "string" }),
        defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
        defineField({ name: "description", type: "text", rows: 4 }),
        defineField({ name: "name", title: "President name", type: "string" }),
        defineField({ name: "role", title: "President role", type: "string" }),
        createAccessibleImageField(
          "image",
          "President image",
          "Optional public president image. Add alt text whenever an image is uploaded.",
        ),
        defineField({ name: "link", title: "Link", type: "object", fields: linkFields }),
      ],
    }),
  ],
});
