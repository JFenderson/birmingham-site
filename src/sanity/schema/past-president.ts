import { defineField, defineType } from "sanity";
import {
  createAccessibleImageField,
  createChapterSlugField,
  createPublishedAtField,
  createPublishedField,
} from "./shared.ts";

export const pastPresident = defineType({
  name: "pastPresident",
  title: "Past President",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      description: "Publicly displayed past president name.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "yearsServed",
      title: "Years served",
      type: "string",
      description: "Example: 2018-2020 or 2024.",
      validation: (rule) => rule.required(),
    }),
    createAccessibleImageField(
      "portrait",
      "Portrait",
      "Optional public portrait for this past president. Add alt text whenever an image is uploaded.",
    ),
    defineField({
      name: "bio",
      type: "text",
      rows: 4,
      description: "Optional short public biography or legacy note.",
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      description: "Use this to highlight a past president in public layouts.",
      initialValue: false,
      validation: (rule) => rule.required(),
    }),
    createChapterSlugField("past president profile"),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers appear first in the past presidents list.",
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0),
    }),
    createPublishedField("past president profile"),
    createPublishedAtField("past president profile"),
  ],
});
