import { test } from "node:test";
import assert from "node:assert/strict";
import encodeQR from "qr";
import { decodeQR } from "qr/decode.js";

test("printed check-in QR can be decoded to its opaque reservation code", () => {
  const code = "SFK-CI:41359fe1-4ab6-483e-85e6-9ec1a93495a1";
  const matrix = encodeQR(code, "raw", { border: 4 });
  const scale = 6;
  const width = matrix.length * scale;
  const data = new Uint8ClampedArray(width * width * 4);
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      const value = matrix[Math.floor(y / scale)]?.[Math.floor(x / scale)] ? 0 : 255;
      const offset = (y * width + x) * 4;
      data[offset] = data[offset + 1] = data[offset + 2] = value;
      data[offset + 3] = 255;
    }
  }
  assert.equal(decodeQR({ width, height: width, data }), code);
  assert.match(encodeQR(code, "data-url", { scale: 4, border: 4 }), /^data:image\/gif;base64,/);
});
