import { defineField, defineType } from "sanity";
import {
  createChapterSlugField,
  createPublishedAtField,
  createPublishedField,
  createSafeExternalUrlField,
} from "./shared.ts";

export const foundationEvent = defineType({
  name: "foundationEvent",
  title: "Foundation Event",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      description: "Short public name for the foundation event card or listing.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 4,
      description: "Public summary explaining what the event is and who it serves.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "date",
      title: "Event date",
      type: "datetime",
      description: "Public date and time shown for this event.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "location",
      type: "string",
      description: "Public location or venue shown for this event.",
      validation: (rule) => rule.required(),
    }),
    createSafeExternalUrlField(
      "registrationUrl",
      "Registration URL",
      "Optional public link where people can register for this event. Use a site path such as /foundation or an HTTPS URL.",
    ),
    createChapterSlugField("foundation event"),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers appear first when multiple events are published.",
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0),
    }),
    createPublishedField("foundation event"),
    createPublishedAtField("foundation event"),
  ],
});
