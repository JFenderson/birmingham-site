import { Resend } from "resend";
import {
  getEmailFrom,
  getFoundationAdminEmail,
  getResendApiKey,
} from "./config.ts";

export type FoundationInformationRequestNotificationParams = {
  to: string;
  submitterName: string;
  submitterEmail: string;
  nonprofitName: string;
  organization?: string | undefined;
  message: string;
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

function toSingleLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function toPlainTextLine(value: string) {
  return toSingleLine(value).replace(/[<>]/g, "");
}

function getSubmitterContent(
  params: Pick<FoundationInformationRequestNotificationParams, "submitterName" | "nonprofitName">,
) {
  const submitterName = toPlainTextLine(params.submitterName);
  const nonprofitName = toPlainTextLine(params.nonprofitName) || "the foundation";

  return {
    subject: "Thanks for Reaching Out — Tau Sigma Charity Foundation",
    text: [
      `Hi ${submitterName},`,
      "",
      `Thank you for requesting information from ${nonprofitName}.`,
      "A foundation representative will follow up soon.",
    ].join("\n"),
  };
}

function getAdminContent(params: FoundationInformationRequestNotificationParams) {
  const submitterName = toPlainTextLine(params.submitterName);
  const submitterEmail = toPlainTextLine(params.submitterEmail);
  const nonprofitName = toPlainTextLine(params.nonprofitName) || "the foundation";
  const organization = params.organization ? toPlainTextLine(params.organization) : "";
  const message = toPlainTextLine(params.message);

  return {
    subject: "New Foundation Information Request",
    text: [
      "New foundation information request submission",
      "",
      `Foundation: ${nonprofitName}`,
      `Name: ${submitterName}`,
      `Email: ${submitterEmail}`,
      ...(organization ? [`Organization: ${organization}`] : []),
      "",
      `Message: ${message}`,
      "",
      "Follow up with the submitter directly.",
    ].join("\n"),
  };
}

type ApplicantTemplateModule =
  typeof import("../../emails/foundation-information-request-received.tsx");
type AdminTemplateModule =
  typeof import("../../emails/foundation-information-request-admin-notification.tsx");

export const foundationInformationRequestNotificationDependencies = {
  createResendClient() {
    return new Resend(getResendApiKey() ?? undefined);
  },
  getAdminRecipient() {
    return getFoundationAdminEmail();
  },
  getEmailFrom() {
    return getEmailFrom();
  },
  loadApplicantTemplate: () =>
    import(
      "../../emails/foundation-information-request-received.tsx"
    ) as Promise<ApplicantTemplateModule>,
  loadAdminTemplate: () =>
    import(
      "../../emails/foundation-information-request-admin-notification.tsx"
    ) as Promise<AdminTemplateModule>,
};

export async function sendFoundationInformationRequestNotification(
  params: FoundationInformationRequestNotificationParams,
): Promise<{ submitterError: Error | null; adminError: Error | null }> {
  const resend = foundationInformationRequestNotificationDependencies.createResendClient();
  const submitterContent = getSubmitterContent(params);
  const adminContent = getAdminContent(params);
  const adminRecipient = foundationInformationRequestNotificationDependencies.getAdminRecipient();
  const from = foundationInformationRequestNotificationDependencies.getEmailFrom();

  let submitterError: Error | null = null;
  let adminError: Error | null = null;

  try {
    const { FoundationInformationRequestReceivedEmail } =
      await foundationInformationRequestNotificationDependencies.loadApplicantTemplate();
    const result = await resend.emails.send({
      from,
      to: params.to,
      subject: submitterContent.subject,
      text: submitterContent.text,
      react: FoundationInformationRequestReceivedEmail({
        submitterName: params.submitterName,
        nonprofitName: params.nonprofitName,
      }),
    });
    throwIfResendError(result);
  } catch (error) {
    submitterError = toError(error);
  }

  if (!adminRecipient) {
    return { submitterError, adminError };
  }

  try {
    const { FoundationInformationRequestAdminNotificationEmail } =
      await foundationInformationRequestNotificationDependencies.loadAdminTemplate();
    const result = await resend.emails.send({
      from,
      to: adminRecipient,
      subject: adminContent.subject,
      text: adminContent.text,
      react: FoundationInformationRequestAdminNotificationEmail({
        submitterName: params.submitterName,
        submitterEmail: params.submitterEmail,
        nonprofitName: params.nonprofitName,
        organization: params.organization,
        message: params.message,
      }),
    });
    throwIfResendError(result);
  } catch (error) {
    adminError = toError(error);
  }

  return { submitterError, adminError };
}
