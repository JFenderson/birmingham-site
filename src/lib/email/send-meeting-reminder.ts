import { Resend } from "resend";
import { MeetingReminderEmail } from "@/emails/meeting-reminder";

export async function sendMeetingReminderEmail(params: {
  to: string;
  recipientName: string;
  eventTitle: string;
  startsAt: string;
  locationName: string | null;
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "notifications@birminghamsigmas.org",
    to: params.to,
    subject: `Reminder: ${params.eventTitle}`,
    react: MeetingReminderEmail(params),
  });
}
