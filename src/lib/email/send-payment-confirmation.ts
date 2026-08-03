import { Resend } from "resend";
import { PaymentConfirmationEmail } from "@/emails/payment-confirmation";

export async function sendPaymentConfirmationEmail(params: {
  to: string;
  recipientName: string;
  amountCents: number;
  type: "dues" | "event_fee" | "donation";
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "notifications@birminghamsigmas.org",
    to: params.to,
    subject: "Payment Received",
    react: PaymentConfirmationEmail({
      recipientName: params.recipientName,
      amountCents: params.amountCents,
      type: params.type,
    }),
  });
}
