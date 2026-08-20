import { defineField, defineType } from "sanity";
import {
  createAccessibleImageField,
  createChapterSlugField,
  createPublishedAtField,
  createPublishedField,
  createSafeExternalUrlField,
} from "./shared.ts";

export const sigmaBetaEvent = defineType({
  name: "sigmaBetaEvent",
  title: "Sigma Beta Club Event",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      description: "Short public name for the Sigma Beta Club event card or listing.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      description: "URL-friendly identifier for this event's page.",
      options: { source: "title" },
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
      name: "eventDate",
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
      "Optional public link where families can register for this event. Use a site path such as /sigma-beta-club or an HTTPS URL.",
    ),
    createAccessibleImageField(
      "image",
      "Event image",
      "Public image shown with this event. Add alt text whenever an image is uploaded.",
      { required: true },
    ),
    createChapterSlugField("Sigma Beta Club event"),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers appear first when multiple events are published.",
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0),
    }),
    createPublishedField("Sigma Beta Club event"),
    createPublishedAtField("Sigma Beta Club event"),
  ],
});
