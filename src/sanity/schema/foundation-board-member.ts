import { defineField, defineType } from "sanity";
import {
  createAccessibleImageField,
  createChapterSlugField,
  createPublishedField,
} from "./shared.ts";

export const foundationBoardMember = defineType({
  name: "foundationBoardMember",
  title: "Foundation Board Member",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      description: "Publicly displayed board member name.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "role",
      type: "string",
      description: "Public office or responsibility shown with the board member's name.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "bio",
      type: "text",
      rows: 4,
      description: "Optional short public bio for this board member.",
    }),
    createAccessibleImageField(
      "portrait",
      "Portrait",
      "Public portrait for this board member. Add alt text whenever an image is uploaded.",
      { required: true },
    ),
    createChapterSlugField("foundation board member profile"),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers appear first in the board member list.",
      initialValue: 0,
      validation: (rule) => rule.required().integer().min(0),
    }),
    createPublishedField("foundation board member profile"),
  ],
});
