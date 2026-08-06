import { defineField, defineType } from "sanity";

export const post = defineType({
  name: "post",
  title: "Post",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", options: { source: "title" }, validation: (r) => r.required() }),
    defineField({
      name: "chapterSlug",
      type: "string",
      description: "Which chapter subdomain this post belongs to",
      // Keep this list in sync with the chapters actually configured in
      // CHAPTER_SLUG_MAP (see .env.example) — these are the illustrative
      // slugs documented there.
      options: { list: ["root", "miles"] },
      validation: (r) => r.required(),
    }),
    defineField({ name: "publishedAt", type: "datetime" }),
    defineField({ name: "coverImage", type: "image" }),
    defineField({ name: "body", type: "array", of: [{ type: "block" }] }),
  ],
});
