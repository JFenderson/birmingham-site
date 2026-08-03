import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaymentConfirmationEmail } from "@/lib/email/send-payment-confirmation";

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

  if (!error) {
    // Best-effort confirmation email — a send failure must never fail the
    // payment recording itself, which has already succeeded above.
    try {
      const [{ data: profile }, { data: userData }] = await Promise.all([
        admin.from("profiles").select("full_name").eq("id", params.profileId).maybeSingle(),
        admin.auth.admin.getUserById(params.profileId),
      ]);
      const email = userData.user?.email;
      if (email) {
        await sendPaymentConfirmationEmail({
          to: email,
          recipientName: profile?.full_name ?? "there",
          amountCents: params.amountCents,
          type: params.type,
        });
      }
    } catch {
      // Email is best-effort — the transaction itself already succeeded.
    }
  }

  return { error: error ? "Could not record transaction." : null };
}
