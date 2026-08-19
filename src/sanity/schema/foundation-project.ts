import { defineField, defineType } from "sanity";
import {
  createAccessibleImageField,
  createChapterSlugField,
  createPublishedAtField,
  createPublishedField,
} from "./shared.ts";

export const foundationProject = defineType({
  name: "foundationProject",
  title: "Foundation Project",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      description: "Public title for the foundation project.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 4,
      description: "Public summary explaining the project's purpose and impact.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "date",
      title: "Project date",
      type: "date",
      description: "Public date associated with this project.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "projectType",
      title: "Project type",
      type: "string",
      description: "Public category shown for this project, such as scholarship or community service.",
      validation: (rule) => rule.required(),
    }),
    createAccessibleImageField(
      "image",
      "Project image",
      "Public image shown with this project. Add alt text whenever an image is uploaded.",
      { required: true },
    ),
    defineField({
      name: "gallery",
      title: "Additional images",
      type: "array",
      description: "Optional additional public images for this project. Each requires alt text.",
      of: [
        {
          type: "image",
          name: "projectGalleryImage",
          title: "Project image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Alt text",
              type: "string",
              description: "Describe the image for people who cannot see it.",
              validation: (rule) => rule.required(),
            }),
          ],
        },
      ],
    }),
    createChapterSlugField("foundation project"),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers appear first when multiple projects are published.",
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0),
    }),
    createPublishedField("foundation project"),
    createPublishedAtField("foundation project"),
  ],
});
