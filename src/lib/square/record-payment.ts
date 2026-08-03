import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaymentConfirmationEmail } from "@/lib/email/send-payment-confirmation";
import { resolveRecipient } from "@/lib/email/resolve-recipient";

export async function recordTransaction(params: {
  chapterId: string;
  profileId: string;
  type: "dues" | "event_fee" | "donation";
  amountCents: number;
  squarePaymentId: string;
  status: "pending" | "completed" | "failed";
  description: string | null;
}): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { error } = await admin.from("transactions").insert({
    chapter_id: params.chapterId,
    profile_id: params.profileId,
    type: params.type,
    amount_cents: params.amountCents,
    status: params.status,
    square_payment_id: params.squarePaymentId,
    description: params.description,
  });

  if (!error && params.status === "completed") {
    // Best-effort confirmation email — a send failure must never fail the
    // payment recording itself, which has already succeeded above. Only a
    // completed payment should trigger a "Payment Received" email — a
    // failed or still-pending payment must still be recorded (unchanged
    // above) but must NOT tell the member their payment succeeded.
    try {
      const recipient = await resolveRecipient(admin, params.profileId);
      if (recipient) {
        await sendPaymentConfirmationEmail({
          to: recipient.email,
          recipientName: recipient.name,
          amountCents: params.amountCents,
          type: params.type,
        });
      }
    } catch (err) {
      // Email is best-effort — the transaction itself already succeeded.
      console.error(
        `[email] Payment confirmation failed. chapterId=${params.chapterId} profileId=${params.profileId} squarePaymentId=${params.squarePaymentId}`,
        err
      );
    }
  }

  return { error: error ? "Could not record transaction." : null };
}
