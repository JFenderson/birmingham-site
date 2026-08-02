import { createHmac, timingSafeEqual } from "node:crypto";

export function verifySquareSignature(
  signature: string,
  notificationUrl: string,
  body: string
): boolean {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY!;
  const hmac = createHmac("sha256", key);
  hmac.update(notificationUrl + body);
  const expected = hmac.digest("base64");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
