import { Resend } from "resend";
import { IntakeReceivedEmail } from "@/emails/intake-received";

export async function sendIntakeReceivedEmail(params: {
  to: string;
  applicantName: string;
  chapterName: string;
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "notifications@birminghamsigmas.org",
    to: params.to,
    subject: "Application Received",
    react: IntakeReceivedEmail({
      applicantName: params.applicantName,
      chapterName: params.chapterName,
    }),
  });
}
