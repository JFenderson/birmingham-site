import { createAdminClient } from "@/lib/supabase/admin";

export async function handleSquareWebhookEvent(event: {
  event_id?: string;
  type: string;
  data: { object: { payment?: { id: string; status: string } } };
}, eventId: string): Promise<void> {
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
  const { error: eventError } = await (admin as any).from("square_webhook_events").upsert({
    event_id: event.event_id ?? eventId, payment_id: payment.id, payload: event,
  }, { onConflict: "event_id", ignoreDuplicates: true });
  if (eventError) throw new Error("Could not queue Square webhook event.");
  const { data, error } = await admin
    .from("transactions")
    .update({ status })
    .eq("square_payment_id", payment.id)
    .select("id");

  if (error) {
    console.error(
      `[square] Webhook status update failed. ` +
        `squarePaymentId=${payment.id} attemptedStatus=${status} error=${error.message}`
    );
    throw new Error("Could not apply Square webhook event.");
  }

  if (!data || data.length === 0) {
    throw new Error(`Square webhook payment ${payment.id} has no transaction yet.`);
  }
  const { error: intentError } = await (admin as any).from("payment_intents")
    .update({ status }).eq("square_payment_id", payment.id);
  if (intentError) throw new Error("Could not update payment intent.");
  const { error: processedError } = await (admin as any).from("square_webhook_events")
    .update({ processed_at: new Date().toISOString(), last_error: null })
    .eq("event_id", event.event_id ?? eventId);
  if (processedError) throw new Error("Could not mark Square webhook processed.");
}
