import { defineField, defineType } from "sanity";

export const post = defineType({
  name: "post",
  title: "Post",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", options: { source: "title" }, validation: (r) => r.required() }),
    defineField({ name: "chapterSlug", type: "string", description: "Which chapter subdomain this post belongs to (e.g. 'root', 'miles')" }),
    defineField({ name: "publishedAt", type: "datetime" }),
    defineField({ name: "coverImage", type: "image" }),
    defineField({ name: "body", type: "array", of: [{ type: "block" }] }),
  ],
});
