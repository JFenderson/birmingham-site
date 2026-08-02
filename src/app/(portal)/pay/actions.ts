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
  const response = await square.payments.create({
    sourceId: data.sourceId,
    idempotencyKey: randomUUID(),
    amountMoney: { amount: BigInt(data.amountCents), currency: "USD" },
    locationId: process.env.SQUARE_LOCATION_ID!,
  });

  const payment = response.payment;
  if (!payment || !payment.id) {
    return { error: "Payment failed. Please try again." };
  }

  const result = await recordTransaction({
    chapterId,
    profileId: user.id,
    type: data.type,
    amountCents: data.amountCents,
    squarePaymentId: payment.id,
    status: payment.status === "COMPLETED" ? "completed" : "pending",
    description: data.description || null,
  });

  return result;
}
