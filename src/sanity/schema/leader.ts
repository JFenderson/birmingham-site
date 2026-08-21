import { defineArrayMember, defineField, defineType } from "sanity";
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
      validation: (rule) => rule,
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
      description: "Legacy single-placement field. Use Leadership placements when a brother serves in multiple sections.",
      initialValue: "executiveBoard",
      options: {
        list: [
          { title: "Executive Board", value: "executiveBoard" },
          { title: "Committee Chairmen", value: "committeeChairmen" },
          { title: "Fraternity Leadership", value: "fraternityLeadership" },
        ],
        layout: "radio",
      },
      hidden: ({ document }) => Array.isArray(document?.placements) && document.placements.length > 0,
      validation: (rule) => rule,
    }),
    defineField({
      name: "fraternityLevel",
      title: "Fraternity leadership level",
      type: "string",
      description: "Legacy single-placement field. Use Leadership placements for new or multi-section records.",
      options: {
        list: [
          { title: "State", value: "state" },
          { title: "Regional", value: "regional" },
          { title: "International", value: "international" },
        ],
      },
      hidden: ({ parent, document }) =>
        (Array.isArray(document?.placements) && document.placements.length > 0) ||
        parent?.section !== "fraternityLeadership",
      validation: (rule) => rule.custom((value, context) => {
        const parent = context.parent as { section?: string } | undefined;
        if (parent?.section !== "fraternityLeadership") return true;
        return value ? true : "Choose State, Regional, or International.";
      }),
    }),
    defineField({
      name: "placements",
      title: "Leadership placements",
      type: "array",
      description: "Add one placement for every public section where this brother serves. Use this instead of duplicating the leader.",
      of: [
        defineArrayMember({
          name: "leadershipPlacement",
          title: "Leadership placement",
          type: "object",
          fields: [
            defineField({
              name: "section",
              title: "Section",
              type: "string",
              options: {
                list: [
                  { title: "Executive Board", value: "executiveBoard" },
                  { title: "Committee Chairmen", value: "committeeChairmen" },
                  { title: "Fraternity Leadership", value: "fraternityLeadership" },
                ],
              },
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "fraternityLevel",
              title: "Fraternity leadership level",
              type: "string",
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
            defineField({
              name: "role",
              title: "Role in this placement",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "order",
              title: "Display order",
              type: "number",
              initialValue: 0,
              validation: (rule) => rule.required().integer().min(0),
            }),
          ],
          preview: {
            select: { title: "role", subtitle: "section" },
          },
        }),
      ],
      validation: (rule) => rule.unique(),
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
      description: "Legacy single-placement order. Use the order inside Leadership placements for new records.",
      initialValue: 0,
      hidden: ({ document }) => Array.isArray(document?.placements) && document.placements.length > 0,
      validation: (rule) => rule.integer().min(0),
    }),
    createPublishedField("leader profile"),
  ],
});
