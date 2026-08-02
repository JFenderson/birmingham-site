import { createAdminClient } from "@/lib/supabase/admin";

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
  return { error: error ? "Could not record transaction." : null };
}
