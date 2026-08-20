import { defineField, defineType } from "sanity";
import {
  createAccessibleImageField,
  createChapterSlugField,
  createPublishedAtField,
  createPublishedField,
  createSafeExternalUrlField,
} from "./shared.ts";

export const foundationSettings = defineType({
  name: "foundationSettings",
  title: "Tau Sigma Charity Foundation Settings",
  type: "document",
  fields: [
    createChapterSlugField("Tau Sigma Charity Foundation settings document"),
    createPublishedField("Tau Sigma Charity Foundation settings document"),
    createPublishedAtField("Tau Sigma Charity Foundation settings document"),
    defineField({
      name: "nonprofitName",
      title: "Nonprofit name",
      type: "string",
      description: "Public legal name of the foundation shown on the page.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "taxStatusStatement",
      title: "501(c)(3) statement",
      type: "text",
      rows: 3,
      description: "Public statement of the foundation's 501(c)(3) nonprofit status.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "purpose",
      title: "Purpose",
      type: "text",
      rows: 4,
      description: "Public statement of the foundation's charitable purpose.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "overview",
      title: "Overview",
      type: "text",
      rows: 4,
      description: "Public summary explaining what the foundation does.",
      validation: (rule) => rule.required(),
    }),
    createSafeExternalUrlField(
      "donationUrl",
      "Donation URL",
      "Public donation link. Use a site path such as /foundation or the approved Square/external HTTPS donation URL.",
      { required: true },
    ),
    defineField({
      name: "infoRequestIntro",
      title: "Information request introduction",
      type: "text",
      rows: 4,
      description: "Public introduction shown above the foundation information-request form.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "contactEmail",
      title: "Contact email",
      type: "string",
      description: "Public contact email address shown for the foundation.",
      validation: (rule) => rule.required().email(),
    }),
    createAccessibleImageField(
      "heroImage",
      "Hero image",
      "Public hero image shown at the top of the foundation page. Add alt text whenever an image is uploaded.",
      { required: true },
    ),
  ],
});
