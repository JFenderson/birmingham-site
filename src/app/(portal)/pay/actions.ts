"use server";

import { headers } from "next/headers";
import { requireRole } from "@/lib/auth/rbac";
import { createSquareClient } from "@/lib/square/client";
import { recordTransaction } from "@/lib/square/record-payment";
import { paymentIntentSchema } from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import { beginPaymentIntent, recordPaymentIntentResult } from "@/lib/square/payment-intent";

const ALL_ROLES = [
  "Member",
  "Treasurer",
  "Secretary",
  "Intake Director",
  "Admin",
] as const;

export async function submitPayment(
  input: Record<string, unknown>
): Promise<{ error: string | null }> {
  const parsed = paymentIntentSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid payment details." };
  const data = parsed.data;

  const { chapterId, user } = await requireRole(ALL_ROLES, { requireMfa: false });
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limits = await Promise.all([
    checkRateLimit(`payment:member:${user.id}`, { limit: 10, windowMs: 60 * 60_000 }),
    checkRateLimit(`payment:ip:${ip}`, { limit: 20, windowMs: 60 * 60_000 }),
  ]);
  if (limits.some((result) => !result.success)) return { error: "Too many payment attempts. Please wait before trying again." };
  const intent = await beginPaymentIntent({
    chapterId, profileId: user.id, clientRequestId: data.clientRequestId,
    type: data.type, amountCents: data.amountCents,
  });
  if (!intent) return { error: "This payment request is invalid. Start a new payment." };
  if (intent.square_payment_id) {
    return intent.status === "completed" ? { error: null } : { error: "This payment attempt has already been processed. Check your payment history before trying again." };
  }

  const square = createSquareClient();
  let payment;
  try {
    const response = await square.payments.create({
      sourceId: data.sourceId,
      idempotencyKey: data.clientRequestId,
      amountMoney: { amount: BigInt(data.amountCents), currency: "USD" },
      locationId: process.env.SQUARE_LOCATION_ID!,
    });
    payment = response.payment;
  } catch {
    // Square throws (rather than returning a non-2xx payment object) for
    // declined cards and other non-2xx responses — treat that the same as
    // the "no payment returned" case below.
    return { error: "Payment failed. Please try again." };
  }

  if (!payment || !payment.id) {
    return { error: "Payment failed. Please try again." };
  }

  let status: "pending" | "completed" | "failed";
  if (payment.status === "COMPLETED") {
    status = "completed";
  } else if (payment.status === "FAILED" || payment.status === "CANCELED") {
    status = "failed";
  } else {
    status = "pending";
  }

  const result = await recordTransaction({
    chapterId,
    profileId: user.id,
    type: data.type,
    amountCents: data.amountCents,
    squarePaymentId: payment.id,
    status,
    description: data.description || null,
  });

  await recordPaymentIntentResult(intent.id, payment.id, status);

  if (result.error) {
    // The charge succeeded but we failed to record it — do NOT tell the
    // user to retry, since idempotencyKey is fresh per attempt and a retry
    // would be a genuine second charge. Surface a reference for manual
    // reconciliation instead.
    console.error(
      `[square] Charge succeeded but recordTransaction failed. ` +
        `squarePaymentId=${payment.id} amountCents=${data.amountCents} ` +
        `profileId=${user.id} chapterId=${chapterId}`
    );
    return {
      error: `Payment was processed but couldn't be recorded — contact an officer with reference ${payment.id}.`,
    };
  }

  return result;
}
