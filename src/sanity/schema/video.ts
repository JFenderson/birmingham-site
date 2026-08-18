import { defineField, defineType } from "sanity";
import {
  createAccessibleImageField,
  createChapterSlugField,
  createPublishedAtField,
  createPublishedField,
  createVideoUrlField,
} from "./shared.ts";

export const video = defineType({
  name: "video",
  title: "Video",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      description: "Public title for the embedded or linked video.",
      validation: (rule) => rule.required(),
    }),
    createChapterSlugField("video"),
    createPublishedField("video"),
    createPublishedAtField("video"),
    defineField({
      name: "provider",
      type: "string",
      description: "Choose the platform hosting this public video.",
      options: {
        list: [
          { title: "YouTube", value: "youtube" },
          { title: "Vimeo", value: "vimeo" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    createVideoUrlField(),
    createAccessibleImageField(
      "thumbnail",
      "Thumbnail",
      "Required preview image shown before someone opens the video.",
      { required: true },
    ),
    defineField({
      name: "description",
      type: "text",
      rows: 4,
      description: "Optional context about the video, speaker, or event.",
    }),
  ],
});
