import { defineField, defineType } from "sanity";
import { createChapterSlugField, createPublishedField } from "./shared.ts";

export const program = defineType({
  name: "program",
  title: "Program",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      description: "Public title for the program or initiative.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 4,
      description: "Public summary explaining the program's purpose and impact.",
      validation: (rule) => rule.required(),
    }),
    createChapterSlugField("program"),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers appear first when multiple programs are published.",
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0),
    }),
    createPublishedField("program"),
  ],
});
