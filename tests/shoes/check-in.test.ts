import assert from "node:assert/strict";
import test from "node:test";
import { parseShoeCheckInCode, shoeCheckInUrl } from "../../src/lib/shoes/check-in.ts";

const code = "SFK-CI:12345678-1234-4234-8234-123456789abc";

test("check-in QR opens a page and keeps legacy camera scans working", () => {
  const url = shoeCheckInUrl(code, "https://birminghamsigmas.org");
  assert.equal(url, `https://birminghamsigmas.org/shoes-for-kids/check-in?code=${encodeURIComponent(code)}`);
  assert.equal(parseShoeCheckInCode(url), code);
  assert.equal(parseShoeCheckInCode(code), code);
  assert.equal(parseShoeCheckInCode("https://elsewhere.test/?code=" + encodeURIComponent(code)), null);
  assert.equal(parseShoeCheckInCode("SFK-CI:invalid"), null);
});
