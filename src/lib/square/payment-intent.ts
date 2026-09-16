import { createAdminClient } from "@/lib/supabase/admin";

export async function beginPaymentIntent(input: {
  chapterId: string; profileId: string; clientRequestId: string;
  type: "dues" | "event_fee" | "donation"; amountCents: number;
}) {
  const admin = createAdminClient();
  await (admin as any).from("payment_intents").upsert({
    chapter_id: input.chapterId, profile_id: input.profileId,
    client_request_id: input.clientRequestId, type: input.type,
    amount_cents: input.amountCents,
  }, { onConflict: "chapter_id,profile_id,client_request_id", ignoreDuplicates: true });
  const { data } = await (admin as any).from("payment_intents")
    .select("id, status, square_payment_id, amount_cents, type")
    .eq("chapter_id", input.chapterId).eq("profile_id", input.profileId)
    .eq("client_request_id", input.clientRequestId).maybeSingle();
  if (!data || data.amount_cents !== input.amountCents || data.type !== input.type) return null;
  return data as { id: string; status: string; square_payment_id: string | null };
}

export async function recordPaymentIntentResult(intentId: string, paymentId: string, status: string) {
  await (createAdminClient() as any).from("payment_intents")
    .update({ square_payment_id: paymentId, status })
    .eq("id", intentId);
}
