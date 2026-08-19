import { defineArrayMember, defineField, defineType } from "sanity";
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
      description: "Optional additional public images for this project. Add alt text whenever an image is uploaded.",
      of: [
        defineArrayMember({
          name: "projectGalleryImage",
          title: "Project image",
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Alt text",
              type: "string",
              description: "Describe the image for people who cannot see it.",
            }),
          ],
          validation: (rule) =>
            rule.custom((value) => {
              const photo = value as { asset?: { _ref?: string }; alt?: string } | null;

              if (!photo?.asset?._ref) {
                return "Upload a photo.";
              }

              if (typeof photo.alt !== "string" || photo.alt.trim().length === 0) {
                return "Alt text is required for every public image.";
              }

              return true;
            }),
        }),
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
