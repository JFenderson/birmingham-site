import { defineField, defineType } from "sanity";
import {
  createAccessibleImageField,
  createChapterSlugField,
  createPublishedAtField,
  createPublishedField,
} from "./shared.ts";

export const post = defineType({
  name: "post",
  title: "Post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      description: "Public headline shown on the news listing and article page.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      description: "URL path segment for this article. Generate it from the title, then tweak if needed.",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    createChapterSlugField("post"),
    createPublishedField("post"),
    createPublishedAtField("post"),
    createAccessibleImageField(
      "coverImage",
      "Cover image",
      "Optional hero image for the news listing and article page.",
    ),
    defineField({
      name: "body",
      type: "array",
      description: "Main article content shown on the public news page.",
      of: [{ type: "block" }],
      validation: (rule) => rule.required().min(1),
    }),
  ],
});
