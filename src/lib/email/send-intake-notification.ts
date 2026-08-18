import { Resend } from "resend";
import {
  getEmailFrom,
  getIntakeAdminEmail,
  getResendApiKey,
} from "./config.ts";
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
  if (error instanceof Error) {
    return error;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return new Error((error as { message: string }).message);
  }

  return new Error(String(error));
}

function throwIfResendError(result: unknown): void {
  if (
    result &&
    typeof result === "object" &&
    "error" in result &&
    (result as { error?: unknown }).error
  ) {
    throw toError((result as { error: unknown }).error);
  }
}

type ApplicantTemplateModule = typeof import("../../emails/intake-received.tsx");
type AdminTemplateModule = typeof import("../../emails/intake-admin-notification.tsx");

export const interestFormNotificationDependencies = {
  createResendClient() {
    return new Resend(getResendApiKey() ?? undefined);
  },
  getAdminRecipient() {
    return getIntakeAdminEmail();
  },
  getEmailFrom() {
    return getEmailFrom();
  },
  loadApplicantTemplate: () =>
    import("../../emails/intake-received.tsx") as Promise<ApplicantTemplateModule>,
  loadAdminTemplate: () =>
    import(
      "../../emails/intake-admin-notification.tsx"
    ) as Promise<AdminTemplateModule>,
};

export async function sendInterestFormNotifications(
  params: InterestFormNotificationParams,
): Promise<{ applicantError: Error | null; adminError: Error | null }> {
  const resend = interestFormNotificationDependencies.createResendClient();
  const applicantContent = getApplicantInterestNotificationContent(params);
  const adminContent = getAdminInterestNotificationContent(params);
  const adminRecipient = interestFormNotificationDependencies.getAdminRecipient();
  const from = interestFormNotificationDependencies.getEmailFrom();

  let applicantError: Error | null = null;
  let adminError: Error | null = null;

  try {
    const { IntakeReceivedEmail } =
      await interestFormNotificationDependencies.loadApplicantTemplate();
    const result = await resend.emails.send({
      from,
      to: params.to,
      subject: applicantContent.subject,
      text: applicantContent.text,
      react: IntakeReceivedEmail({
        applicantName: params.applicantName,
        chapterName: params.chapterName,
        formTypeLabel: params.formTypeLabel,
      }),
    });
    throwIfResendError(result);
  } catch (error) {
    applicantError = toError(error);
  }

  if (!adminRecipient) {
    return { applicantError, adminError };
  }

  try {
    const { IntakeAdminNotificationEmail } =
      await interestFormNotificationDependencies.loadAdminTemplate();
    const result = await resend.emails.send({
      from,
      to: adminRecipient,
      subject: adminContent.subject,
      text: adminContent.text,
      react: IntakeAdminNotificationEmail({
        applicantName: params.applicantName,
        applicantEmail: params.applicantEmail,
        chapterName: params.chapterName,
        formTypeLabel: params.formTypeLabel,
      }),
    });
    throwIfResendError(result);
  } catch (error) {
    adminError = toError(error);
  }

  return { applicantError, adminError };
}
