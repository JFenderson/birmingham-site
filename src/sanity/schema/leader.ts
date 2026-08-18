import { defineField, defineType } from "sanity";
import { createChapterSlugField, createPublishedField } from "./shared.ts";

export const leader = defineType({
  name: "leader",
  title: "Leader",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      description: "Publicly displayed leader name.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "role",
      type: "string",
      description: "Public office or responsibility shown with the leader's name.",
      validation: (rule) => rule.required(),
    }),
    createChapterSlugField("leader profile"),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers appear first in the leadership list.",
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0),
    }),
    createPublishedField("leader profile"),
  ],
});
