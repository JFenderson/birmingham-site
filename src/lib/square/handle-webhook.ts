import { createAdminClient } from "@/lib/supabase/admin";

export async function handleSquareWebhookEvent(event: {
  type: string;
  data: { object: { payment?: { id: string; status: string } } };
}): Promise<void> {
  if (event.type !== "payment.updated") return;
  const payment = event.data?.object?.payment;
  if (!payment) return;

  const statusMap: Record<string, string> = {
    COMPLETED: "completed",
    FAILED: "failed",
    CANCELED: "failed",
  };
  const status = statusMap[payment.status];
  if (!status) return;

  const admin = createAdminClient();
  const { error } = await admin
    .from("transactions")
    .update({ status })
    .eq("square_payment_id", payment.id);

  if (error) {
    console.error(
      `[square] Webhook status update failed. ` +
        `squarePaymentId=${payment.id} attemptedStatus=${status} error=${error.message}`
    );
  }
}
