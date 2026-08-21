import assert from "node:assert/strict";
import test from "node:test";

import { sanitySchemaTypes } from "../../src/sanity/schema/index.ts";
import { getChapterSlugOptions } from "../../src/sanity/schema/shared.ts";

type ValidatorContext = {
  parent?: unknown;
};

type CustomValidator = (
  value: unknown,
  context: ValidatorContext,
) => true | string | Promise<true | string>;

type SchemaField = {
  name?: string;
  type?: string;
  fields?: SchemaField[];
  of?: SchemaField[];
  validation?: (rule: ValidationRuleRecorder) => ValidationRuleRecorder;
};

class ValidationRuleRecorder {
  requiredCalls = 0;
  integerCalls = 0;
  minValues: unknown[] = [];
  uriOptions: unknown[] = [];
  customValidators: CustomValidator[] = [];

  required() {
    this.requiredCalls += 1;
    return this;
  }

  integer() {
    this.integerCalls += 1;
    return this;
  }

  min(value: unknown) {
    this.minValues.push(value);
    return this;
  }

  uri(options: unknown) {
    this.uriOptions.push(options);
    return this;
  }

  custom(validator: CustomValidator) {
    this.customValidators.push(validator);
    return this;
  }
}

function schemaType(name: string): SchemaField {
  const schema = sanitySchemaTypes.find((candidate) => candidate.name === name);

  assert.ok(schema, `Expected ${name} schema to be registered.`);

  return schema as SchemaField;
}

function schemaField(parent: SchemaField, name: string): SchemaField {
  const field = parent.fields?.find((candidate) => candidate.name === name);

  assert.ok(field, `Expected ${parent.name ?? "schema"} to define ${name}.`);

  return field;
}

function arrayMember(parent: SchemaField, name: string): SchemaField {
  const field = parent.of?.find((candidate) => candidate.name === name);

  assert.ok(field, `Expected array field ${parent.name ?? "unknown"} to define ${name}.`);

  return field;
}

function validationFor(field: SchemaField): ValidationRuleRecorder {
  const validation = field.validation;

  if (typeof validation !== "function") {
    assert.fail(`${field.name ?? "field"} has validation.`);
  }

  const rule = new ValidationRuleRecorder();
  const result = validation(rule);

  assert.equal(result, rule);

  return rule;
}

test("chapter options include root and configured collegiate slugs in a readable list", () => {
  const options = getChapterSlugOptions({
    CHAPTER_SLUG_MAP:
      '{"root":"00000000-0000-0000-0000-000000000001","miles":"00000000-0000-0000-0000-000000000002","talladega":"00000000-0000-0000-0000-000000000003"}',
  });

  assert.deepEqual(options, [
    { title: "Root chapter (root)", value: "root" },
    { title: "Miles chapter (miles)", value: "miles" },
    { title: "Talladega chapter (talladega)", value: "talladega" },
  ]);
});

test("schema registry includes the gallery, video, homepage settings, and past president document types", () => {
  const schemaNames = sanitySchemaTypes.map((schema) => schema.name);

  assert.ok(schemaNames.includes("gallery"));
  assert.ok(schemaNames.includes("video"));
  assert.ok(schemaNames.includes("siteSettings"));
  assert.ok(schemaNames.includes("pastPresident"));
});

test("homepage settings use shared chapter, publication, and public image validators", () => {
  const settingsSchema = schemaType("siteSettings");
  const chapterSlug = schemaField(settingsSchema, "chapterSlug");
  const published = schemaField(settingsSchema, "published");
  const hero = schemaField(settingsSchema, "hero");
  const heroImage = schemaField(hero, "image");
  const primaryAction = schemaField(hero, "primaryAction");
  const primaryActionHref = schemaField(primaryAction, "href");
  const featuredPresident = schemaField(settingsSchema, "featuredPresident");
  const featuredPresidentImage = schemaField(featuredPresident, "image");

  assert.equal(validationFor(chapterSlug).requiredCalls, 1);
  assert.equal(validationFor(published).requiredCalls, 1);
  assert.notEqual(
    validationFor(heroImage).customValidators[0]!({ asset: { _ref: "image-ref" }, alt: "" }, {}),
    true,
  );
  assert.equal(
    validationFor(featuredPresidentImage).customValidators[0]!({
      asset: { _ref: "image-ref" },
    alt: "Chapter president addressing the room",
  }, {}),
    true,
  );

  const hrefRule = validationFor(primaryActionHref);
  assert.equal(hrefRule.requiredCalls, 1);
  assert.equal(hrefRule.customValidators.length, 1);
  assert.equal(hrefRule.customValidators[0]!("/about?from=home", {}), true);
  assert.equal(hrefRule.customValidators[0]!("https://phibetasigma1914.org/", {}), true);
  assert.notEqual(hrefRule.customValidators[0]!("javascript:alert(1)", {}), true);
  assert.notEqual(hrefRule.customValidators[0]!("mailto:president@example.com", {}), true);
  assert.notEqual(hrefRule.customValidators[0]!("//evil.example/phish", {}), true);
});

test("leader schema supports portraits, bios, and public leadership sections", () => {
  const leaderSchema = schemaType("leader");
  const portrait = schemaField(leaderSchema, "portrait");
  const bio = schemaField(leaderSchema, "bio");
  const designation = schemaField(leaderSchema, "designation");
  const section = schemaField(leaderSchema, "section");
  const fraternityLevel = schemaField(leaderSchema, "fraternityLevel");
  const placements = schemaField(leaderSchema, "placements");

  assert.equal(portrait.type, "image");
  assert.equal(bio.type, "text");
  assert.equal(designation.type, "string");
  assert.equal(section.type, "string");
  assert.equal(fraternityLevel.type, "string");
  assert.equal(placements.type, "array");
  assert.equal(placements.of?.[0]?.type, "object");
  assert.equal(section.validation?.length, undefined);
  assert.notEqual(
    validationFor(portrait).customValidators[0]!({ asset: { _ref: "image-ref" }, alt: "   " }, {}),
    true,
  );
  assert.equal(validationFor(designation).requiredCalls, 1);
});

test("past president schema uses shared chapter, publication, and image validators", () => {
  const pastPresidentSchema = schemaType("pastPresident");
  const chapterSlug = schemaField(pastPresidentSchema, "chapterSlug");
  const published = schemaField(pastPresidentSchema, "published");
  const portrait = schemaField(pastPresidentSchema, "portrait");

  assert.equal(validationFor(chapterSlug).requiredCalls, 1);
  assert.equal(validationFor(published).requiredCalls, 1);
  assert.equal(portrait.type, "image");
  assert.notEqual(
    validationFor(portrait).customValidators[0]!({ asset: { _ref: "image-ref" }, alt: "" }, {}),
    true,
  );
});

test("post schema requires editor-written excerpts for public news cards", () => {
  const excerpt = schemaField(schemaType("post"), "excerpt");
  const rule = validationFor(excerpt);

  assert.equal(excerpt.type, "text");
  assert.equal(rule.requiredCalls, 1);
});

test("chapter slug validation requires a configured chapter", () => {
  const chapterSlug = schemaField(schemaType("post"), "chapterSlug");
  const rule = validationFor(chapterSlug);

  assert.equal(rule.requiredCalls, 1);
  assert.equal(rule.customValidators.length, 1);
  assert.equal(rule.customValidators[0]!("root", {}), true);
  assert.notEqual(rule.customValidators[0]!("", {}), true);
  assert.notEqual(rule.customValidators[0]!("unknown-chapter", {}), true);
});

test("publication state and date validators protect publish readiness", () => {
  const postSchema = schemaType("post");
  const published = schemaField(postSchema, "published");
  const publishedAt = schemaField(postSchema, "publishedAt");
  const publishedRule = validationFor(published);
  const publishedAtRule = validationFor(publishedAt);

  assert.equal(publishedRule.requiredCalls, 1);
  assert.equal(publishedAtRule.customValidators.length, 1);
  assert.equal(publishedAtRule.customValidators[0]!(undefined, { parent: { published: false } }), true);
  assert.notEqual(
    publishedAtRule.customValidators[0]!(undefined, { parent: { published: true } }),
    true,
  );
  assert.equal(
    publishedAtRule.customValidators[0]!("2026-08-18T12:00:00.000Z", {
      parent: { published: true },
    }),
    true,
  );
});

test("public image validators require alt text when an asset is present", () => {
  const coverImage = schemaField(schemaType("post"), "coverImage");
  const coverImageRule = validationFor(coverImage);
  const alt = schemaField(coverImage, "alt");
  const altRule = validationFor(alt);

  assert.equal(coverImageRule.customValidators.length, 1);
  assert.equal(coverImageRule.customValidators[0]!(undefined, {}), true);
  assert.notEqual(
    coverImageRule.customValidators[0]!({ asset: { _ref: "image-ref" }, alt: "" }, {}),
    true,
  );
  assert.equal(
    coverImageRule.customValidators[0]!({ asset: { _ref: "image-ref" }, alt: "Brothers serving meals" }, {}),
    true,
  );

  assert.equal(altRule.customValidators.length, 1);
  assert.notEqual(
    altRule.customValidators[0]!("", { parent: { asset: { _ref: "image-ref" } } }),
    true,
  );
  assert.equal(
    altRule.customValidators[0]!("Brothers serving meals", {
      parent: { asset: { _ref: "image-ref" } },
    }),
    true,
  );
});

test("post schema supports an ordered gallery with accessible images", () => {
  const gallery = schemaField(schemaType("post"), "gallery");

  assert.equal(gallery.type, "array");
  assert.equal(gallery.validation?.length, undefined);
  assert.ok(gallery.of?.length);
  assert.equal(gallery.of?.[0]?.type, "image");
  assert.ok(gallery.of?.[0]?.fields?.some((field) => field.name === "alt"));
  assert.ok(gallery.of?.[0]?.fields?.some((field) => field.name === "caption"));
});

test("gallery photo validators require uploaded assets and alt text", () => {
  const photos = schemaField(schemaType("gallery"), "photos");
  const photo = arrayMember(photos, "galleryPhoto");
  const rule = validationFor(photo);

  assert.equal(rule.customValidators.length, 1);
  assert.notEqual(rule.customValidators[0]!(undefined, {}), true);
  assert.notEqual(rule.customValidators[0]!({ asset: { _ref: "image-ref" }, alt: "" }, {}), true);
  assert.equal(
    rule.customValidators[0]!({ asset: { _ref: "image-ref" }, alt: "Chapter picnic group photo" }, {}),
    true,
  );
});

test("video schema restricts URLs to matching HTTPS YouTube or Vimeo links", () => {
  const videoSchema = schemaType("video");
  const url = schemaField(videoSchema, "url");
  const rule = validationFor(url);

  assert.equal(rule.requiredCalls, 1);
  assert.deepEqual(rule.uriOptions, [{ scheme: ["https"] }]);
  assert.equal(rule.customValidators.length, 1);
  assert.notEqual(rule.customValidators[0]!("not a url", { parent: { provider: "youtube" } }), true);
  assert.notEqual(rule.customValidators[0]!("https://example.com/watch", { parent: { provider: "youtube" } }), true);
  assert.notEqual(rule.customValidators[0]!("https://vimeo.com/12345", { parent: { provider: "youtube" } }), true);
  assert.equal(
    rule.customValidators[0]!("https://www.youtube.com/watch?v=abc123", {
      parent: { provider: "youtube" },
    }),
    true,
  );
  assert.equal(
    rule.customValidators[0]!("https://vimeo.com/12345", { parent: { provider: "vimeo" } }),
    true,
  );
});

test("video thumbnails are required public images with alt text", () => {
  const thumbnail = schemaField(schemaType("video"), "thumbnail");
  const rule = validationFor(thumbnail);

  assert.equal(rule.customValidators.length, 1);
  assert.notEqual(rule.customValidators[0]!(undefined, {}), true);
  assert.notEqual(rule.customValidators[0]!({ asset: { _ref: "image-ref" }, alt: "" }, {}), true);
  assert.equal(
    rule.customValidators[0]!({ asset: { _ref: "image-ref" }, alt: "Speaker at chapter event" }, {}),
    true,
  );
});
