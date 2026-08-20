import { defineArrayMember, defineField, defineType } from "sanity";
import {
  createAccessibleImageField,
  createChapterSlugField,
  createPublishedAtField,
  createPublishedField,
} from "./shared.ts";

export const sigmaBetaSettings = defineType({
  name: "sigmaBetaSettings",
  title: "Sigma Beta Club Settings",
  type: "document",
  fields: [
    createChapterSlugField("Sigma Beta Club settings document"),
    createPublishedField("Sigma Beta Club settings document"),
    createPublishedAtField("Sigma Beta Club settings document"),
    defineField({
      name: "overview",
      title: "Overview",
      type: "text",
      rows: 4,
      description: "Public summary explaining what the Sigma Beta Club program is.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "mission",
      title: "Mission",
      type: "text",
      rows: 4,
      description: "Public mission statement shown on the Sigma Beta Club page.",
      validation: (rule) => rule.required(),
    }),
    createAccessibleImageField(
      "heroImage",
      "Hero image",
      "Public hero image shown at the top of the Sigma Beta Club page. Add alt text whenever an image is uploaded.",
      { required: true },
    ),
    defineField({
      name: "directorContact",
      title: "Program director contact",
      type: "object",
      description: "Public contact information for the Sigma Beta Club director.",
      fields: [
        defineField({
          name: "label",
          title: "Director name or label",
          type: "string",
          description: "Public name or title shown for the program director.",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "email",
          title: "Director email",
          type: "string",
          description: "Public contact email address for the program director.",
          validation: (rule) => rule.required().email(),
        }),
        defineField({
          name: "phone",
          title: "Director phone",
          type: "string",
          description: "Optional public contact phone number for the program director.",
        }),
      ],
    }),
    defineField({
      name: "advisors",
      title: "Advisors",
      type: "array",
      description: "Public list of Sigma Beta Club advisors shown on the program page.",
      of: [
        defineArrayMember({
          name: "advisor",
          title: "Advisor",
          type: "object",
          fields: [
            defineField({
              name: "name",
              title: "Name",
              type: "string",
              description: "Publicly displayed advisor name.",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "role",
              title: "Role",
              type: "string",
              description: "Public role or responsibility shown with the advisor's name.",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "bio",
              title: "Bio",
              type: "text",
              rows: 4,
              description: "Optional short public bio for this advisor.",
            }),
            createAccessibleImageField(
              "portrait",
              "Portrait",
              "Optional public portrait for this advisor. Add alt text whenever an image is uploaded.",
            ),
          ],
        }),
      ],
    }),
    defineField({
      name: "interestFormIntro",
      title: "Interest form introduction",
      type: "text",
      rows: 4,
      description: "Public introduction shown above the Sigma Beta Club interest form.",
      validation: (rule) => rule.required(),
    }),
  ],
});
