import { defineField, defineType } from "sanity";
import {
  createChapterSlugField,
  createPublishedAtField,
  createPublishedField,
} from "./shared.ts";

export const event = defineType({
  name: "event",
  title: "Community Event",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      description: "Short public name for the event card or listing.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 4,
      description: "Public summary explaining what the event is and who it serves.",
      validation: (rule) => rule.required(),
    }),
    createChapterSlugField("event"),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers appear first when multiple events are published.",
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0),
    }),
    createPublishedField("event"),
    createPublishedAtField("event"),
  ],
});
