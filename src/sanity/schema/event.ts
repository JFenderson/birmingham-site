import { defineField, defineType } from "sanity";

export const event = defineType({
  name: "event",
  title: "Community Event",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "chapterSlug",
      type: "string",
      description: "Which chapter subdomain this event belongs to",
      options: { list: ["root", "miles"] },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: "published",
      type: "boolean",
      initialValue: false,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publishedAt",
      type: "datetime",
      description: "Optional publication time; future dates remain hidden until reached",
    }),
  ],
});
