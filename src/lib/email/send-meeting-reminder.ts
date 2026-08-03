import { Resend } from "resend";
import { MeetingReminderEmail } from "@/emails/meeting-reminder";
import { EMAIL_FROM } from "@/lib/email/config";

export async function sendMeetingReminderEmail(params: {
  to: string;
  recipientName: string;
  eventTitle: string;
  startsAt: string;
  locationName: string | null;
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: `Reminder: ${params.eventTitle}`,
    react: MeetingReminderEmail({
      recipientName: params.recipientName,
      eventTitle: params.eventTitle,
      startsAt: params.startsAt,
      locationName: params.locationName,
    }),
  });
}
