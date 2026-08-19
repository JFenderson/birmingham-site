import assert from "node:assert/strict";
import test from "node:test";

import { sanitySchemaTypes } from "../../src/sanity/schema/index.ts";

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

function assertChapterAndPublished(name: string) {
  const schema = schemaType(name);
  const chapterSlug = schemaField(schema, "chapterSlug");
  const published = schemaField(schema, "published");

  assert.equal(validationFor(chapterSlug).requiredCalls, 1);
  assert.equal(validationFor(chapterSlug).customValidators.length, 1);
  assert.equal(validationFor(published).requiredCalls, 1);
}

function assertNonnegativeOrder(name: string) {
  const schema = schemaType(name);
  const order = schemaField(schema, "order");
  const rule = validationFor(order);

  assert.equal(rule.requiredCalls, 1);
  assert.equal(rule.integerCalls, 1);
  assert.deepEqual(rule.minValues, [0]);
}

function assertAccessibleImage(field: SchemaField) {
  const rule = validationFor(field);

  assert.equal(rule.customValidators.length, 1);
  assert.notEqual(
    rule.customValidators[0]!({ asset: { _ref: "image-ref" }, alt: "" }, {}),
    true,
  );
  assert.equal(
    rule.customValidators[0]!(
      { asset: { _ref: "image-ref" }, alt: "Descriptive alt text" },
      {},
    ),
    true,
  );
}

function assertSafeExternalUrl(field: SchemaField) {
  const rule = validationFor(field);

  assert.equal(rule.customValidators.length, 1);
  assert.equal(rule.customValidators[0]!("/donate", {}), true);
  assert.equal(rule.customValidators[0]!("https://squareup.com/checkout/abc", {}), true);
  assert.notEqual(rule.customValidators[0]!("javascript:alert(1)", {}), true);
  assert.notEqual(rule.customValidators[0]!("mailto:foo@example.com", {}), true);
  assert.notEqual(rule.customValidators[0]!("//evil.example/phish", {}), true);
  assert.notEqual(rule.customValidators[0]!("http://insecure.example", {}), true);
}

test("all six new program content document types are registered", () => {
  const schemaNames = sanitySchemaTypes.map((schema) => schema.name);

  assert.ok(schemaNames.includes("sigmaBetaSettings"));
  assert.ok(schemaNames.includes("sigmaBetaEvent"));
  assert.ok(schemaNames.includes("foundationSettings"));
  assert.ok(schemaNames.includes("foundationProject"));
  assert.ok(schemaNames.includes("foundationEvent"));
  assert.ok(schemaNames.includes("foundationBoardMember"));
});

test("sigmaBetaSettings uses shared chapter and published validators", () => {
  assertChapterAndPublished("sigmaBetaSettings");
});

test("sigmaBetaSettings requires alt text on hero image and embedded advisor portraits", () => {
  const schema = schemaType("sigmaBetaSettings");
  const heroImage = schemaField(schema, "heroImage");
  assertAccessibleImage(heroImage);

  const advisors = schemaField(schema, "advisors");
  const advisor = arrayMember(advisors, "advisor");
  const portrait = schemaField(advisor, "portrait");
  assertAccessibleImage(portrait);
});

test("sigmaBetaEvent uses shared chapter and published validators, order, image, and registration URL", () => {
  assertChapterAndPublished("sigmaBetaEvent");
  assertNonnegativeOrder("sigmaBetaEvent");

  const schema = schemaType("sigmaBetaEvent");
  const image = schemaField(schema, "image");
  assertAccessibleImage(image);

  const registrationUrl = schemaField(schema, "registrationUrl");
  assertSafeExternalUrl(registrationUrl);
});

test("foundationSettings uses shared chapter and published validators, hero image, and donation URL", () => {
  assertChapterAndPublished("foundationSettings");

  const schema = schemaType("foundationSettings");
  const heroImage = schemaField(schema, "heroImage");
  assertAccessibleImage(heroImage);

  const donationUrl = schemaField(schema, "donationUrl");
  assertSafeExternalUrl(donationUrl);
});

test("foundationProject uses shared chapter and published validators, order, and image", () => {
  assertChapterAndPublished("foundationProject");
  assertNonnegativeOrder("foundationProject");

  const schema = schemaType("foundationProject");
  const image = schemaField(schema, "image");
  assertAccessibleImage(image);
});

test("foundationEvent uses shared chapter and published validators, order, and registration URL", () => {
  assertChapterAndPublished("foundationEvent");
  assertNonnegativeOrder("foundationEvent");

  const schema = schemaType("foundationEvent");
  const registrationUrl = schemaField(schema, "registrationUrl");
  assertSafeExternalUrl(registrationUrl);
});

test("foundationBoardMember uses shared chapter and published validators, order, and portrait", () => {
  assertChapterAndPublished("foundationBoardMember");
  assertNonnegativeOrder("foundationBoardMember");

  const schema = schemaType("foundationBoardMember");
  const portrait = schemaField(schema, "portrait");
  assertAccessibleImage(portrait);
});
