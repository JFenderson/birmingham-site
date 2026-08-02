"use server";

import { randomUUID } from "node:crypto";
import { requireRole } from "@/lib/auth/rbac";
import { createSquareClient } from "@/lib/square/client";
import { recordTransaction } from "@/lib/square/record-payment";
import { paymentIntentSchema } from "@/lib/validation/schemas";

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

  const { chapterId, user } = await requireRole(ALL_ROLES);

  const square = createSquareClient();
  let payment;
  try {
    const response = await square.payments.create({
      sourceId: data.sourceId,
      idempotencyKey: randomUUID(),
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
