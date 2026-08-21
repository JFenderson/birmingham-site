import { defineField, defineType } from "sanity";
import {
  createAccessibleImageField,
  createChapterSlugField,
  createPublishedField,
} from "./shared.ts";

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
    defineField({
      name: "designation",
      title: "Leadership designation",
      type: "string",
      description: "Choose whether this profile belongs on the current executive leadership list or board list.",
      initialValue: "currentExecutive",
      options: {
        list: [
          { title: "Current executive leader", value: "currentExecutive" },
          { title: "Board member", value: "board" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "section",
      title: "Public leadership section",
      type: "string",
      description: "Choose where this leader appears on the public leadership page.",
      initialValue: "executiveBoard",
      options: {
        list: [
          { title: "Executive Board", value: "executiveBoard" },
          { title: "Committee Chairmen", value: "committeeChairmen" },
          { title: "Fraternity Leadership", value: "fraternityLeadership" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "fraternityLevel",
      title: "Fraternity leadership level",
      type: "string",
      description: "For Fraternity Leadership only, choose the level at which this brother serves.",
      options: {
        list: [
          { title: "State", value: "state" },
          { title: "Regional", value: "regional" },
          { title: "International", value: "international" },
        ],
      },
      hidden: ({ parent }) => parent?.section !== "fraternityLeadership",
      validation: (rule) => rule.custom((value, context) => {
        const parent = context.parent as { section?: string } | undefined;
        if (parent?.section !== "fraternityLeadership") return true;
        return value ? true : "Choose State, Regional, or International.";
      }),
    }),
    createAccessibleImageField(
      "portrait",
      "Portrait",
      "Optional public portrait for this leader. Add alt text whenever an image is uploaded.",
    ),
    defineField({
      name: "bio",
      type: "text",
      rows: 4,
      description: "Optional short public bio or leadership summary.",
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
