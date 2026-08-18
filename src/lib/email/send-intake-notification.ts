import { Resend } from "resend";
import { EMAIL_FROM } from "./config.ts";
import {
  getAdminInterestNotificationContent,
  getApplicantInterestNotificationContent,
} from "./intake-notification-content.ts";

export type InterestFormNotificationParams = {
  to: string;
  applicantName: string;
  applicantEmail: string;
  chapterName: string;
  formTypeLabel: string;
};

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export async function sendInterestFormNotifications(
  params: InterestFormNotificationParams,
): Promise<{ applicantError: Error | null; adminError: Error | null }> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const applicantContent = getApplicantInterestNotificationContent(params);
  const adminContent = getAdminInterestNotificationContent(params);
  const adminRecipient = process.env.INTAKE_ADMIN_EMAIL?.trim();

  let applicantError: Error | null = null;
  let adminError: Error | null = null;

  try {
    const { IntakeReceivedEmail } = await import("../../emails/intake-received.tsx");
    await resend.emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: applicantContent.subject,
      react: IntakeReceivedEmail({
        applicantName: params.applicantName,
        chapterName: params.chapterName,
        formTypeLabel: params.formTypeLabel,
      }),
    });
  } catch (error) {
    applicantError = toError(error);
  }

  if (!adminRecipient) {
    return { applicantError, adminError };
  }

  try {
    const { IntakeAdminNotificationEmail } = await import(
      "../../emails/intake-admin-notification.tsx"
    );
    await resend.emails.send({
      from: EMAIL_FROM,
      to: adminRecipient,
      subject: adminContent.subject,
      react: IntakeAdminNotificationEmail({
        applicantName: params.applicantName,
        applicantEmail: params.applicantEmail,
        chapterName: params.chapterName,
        formTypeLabel: params.formTypeLabel,
      }),
    });
  } catch (error) {
    adminError = toError(error);
  }

  return { applicantError, adminError };
}
