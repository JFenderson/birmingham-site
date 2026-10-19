import assert from "node:assert/strict";
import test from "node:test";
import { getFormNotificationRecipients } from "../../src/lib/email/config.ts";

test("every program form includes the chapter inbox and its matching recipient once", () => {
  const previous = process.env.CHAPTER_FORM_EMAIL;
  process.env.CHAPTER_FORM_EMAIL = "tausigmapbs@gmail.com";
  try {
    assert.deepEqual(getFormNotificationRecipients("patrickdknight@gmail.com"), [
      "tausigmapbs@gmail.com",
      "patrickdknight@gmail.com",
    ]);
    assert.deepEqual(getFormNotificationRecipients("TAUSIGMAPBS@gmail.com"), [
      "tausigmapbs@gmail.com",
    ]);
    assert.deepEqual(getFormNotificationRecipients(null), ["tausigmapbs@gmail.com"]);
  } finally {
    if (previous === undefined) delete process.env.CHAPTER_FORM_EMAIL;
    else process.env.CHAPTER_FORM_EMAIL = previous;
  }
});

test("program addresses can include multiple recipients", () => {
  const previous = process.env.CHAPTER_FORM_EMAIL;
  process.env.CHAPTER_FORM_EMAIL = "tausigmapbs@gmail.com";
  try {
    assert.deepEqual(
      getFormNotificationRecipients("first@example.com, second@example.com; first@example.com"),
      ["tausigmapbs@gmail.com", "first@example.com", "second@example.com"],
    );
  } finally {
    if (previous === undefined) delete process.env.CHAPTER_FORM_EMAIL;
    else process.env.CHAPTER_FORM_EMAIL = previous;
  }
});

test("chapter inbox has a default when no environment variable is set", () => {
  const previous = process.env.CHAPTER_FORM_EMAIL;
  delete process.env.CHAPTER_FORM_EMAIL;
  try {
    assert.deepEqual(getFormNotificationRecipients(), ["tausigmapbs@gmail.com"]);
  } finally {
    if (previous !== undefined) process.env.CHAPTER_FORM_EMAIL = previous;
  }
});
