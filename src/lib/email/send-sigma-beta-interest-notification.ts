import { Resend } from "resend";
import {
  getEmailFrom,
  getResendApiKey,
  getSigmaBetaAdminEmail,
} from "./config.ts";

export type SigmaBetaInterestNotificationParams = {
  to: string;
  submitterName: string;
  submitterEmail: string;
  chapterName: string;
  roleLabel: string;
  message?: string | undefined;
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
  params: Pick<SigmaBetaInterestNotificationParams, "submitterName" | "chapterName">,
) {
  const submitterName = toPlainTextLine(params.submitterName);
  const chapterName = toPlainTextLine(params.chapterName) || "the chapter";

  return {
    subject: "Thanks for Your Interest — Sigma Beta Club",
    text: [
      `Hi ${submitterName},`,
      "",
      `Thank you for reaching out to the ${chapterName} Sigma Beta Club.`,
      "A club advisor will follow up soon.",
    ].join("\n"),
  };
}

function getAdminContent(params: SigmaBetaInterestNotificationParams) {
  const submitterName = toPlainTextLine(params.submitterName);
  const submitterEmail = toPlainTextLine(params.submitterEmail);
  const chapterName = toPlainTextLine(params.chapterName) || "the chapter";
  const roleLabel = toPlainTextLine(params.roleLabel);
  const message = params.message ? toPlainTextLine(params.message) : "";

  return {
    subject: "New Sigma Beta Club Interest Submission",
    text: [
      "New Sigma Beta Club interest submission",
      "",
      `Chapter: ${chapterName}`,
      `Name: ${submitterName}`,
      `Role: ${roleLabel}`,
      `Email: ${submitterEmail}`,
      ...(message ? ["", `Message: ${message}`] : []),
      "",
      "Follow up with the submitter directly.",
    ].join("\n"),
  };
}

type ApplicantTemplateModule = typeof import("../../emails/sigma-beta-interest-received.tsx");
type AdminTemplateModule = typeof import("../../emails/sigma-beta-interest-admin-notification.tsx");

export const sigmaBetaInterestNotificationDependencies = {
  createResendClient() {
    return new Resend(getResendApiKey() ?? undefined);
  },
  getAdminRecipient() {
    return getSigmaBetaAdminEmail();
  },
  getEmailFrom() {
    return getEmailFrom();
  },
  loadApplicantTemplate: () =>
    import("../../emails/sigma-beta-interest-received.tsx") as Promise<ApplicantTemplateModule>,
  loadAdminTemplate: () =>
    import(
      "../../emails/sigma-beta-interest-admin-notification.tsx"
    ) as Promise<AdminTemplateModule>,
};

export async function sendSigmaBetaInterestNotification(
  params: SigmaBetaInterestNotificationParams,
): Promise<{ submitterError: Error | null; adminError: Error | null }> {
  const resend = sigmaBetaInterestNotificationDependencies.createResendClient();
  const submitterContent = getSubmitterContent(params);
  const adminContent = getAdminContent(params);
  const adminRecipient = sigmaBetaInterestNotificationDependencies.getAdminRecipient();
  const from = sigmaBetaInterestNotificationDependencies.getEmailFrom();

  let submitterError: Error | null = null;
  let adminError: Error | null = null;

  try {
    const { SigmaBetaInterestReceivedEmail } =
      await sigmaBetaInterestNotificationDependencies.loadApplicantTemplate();
    const result = await resend.emails.send({
      from,
      to: params.to,
      subject: submitterContent.subject,
      text: submitterContent.text,
      react: SigmaBetaInterestReceivedEmail({
        submitterName: params.submitterName,
        chapterName: params.chapterName,
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
    const { SigmaBetaInterestAdminNotificationEmail } =
      await sigmaBetaInterestNotificationDependencies.loadAdminTemplate();
    const result = await resend.emails.send({
      from,
      to: adminRecipient,
      subject: adminContent.subject,
      text: adminContent.text,
      react: SigmaBetaInterestAdminNotificationEmail({
        submitterName: params.submitterName,
        submitterEmail: params.submitterEmail,
        chapterName: params.chapterName,
        roleLabel: params.roleLabel,
        message: params.message,
      }),
    });
    throwIfResendError(result);
  } catch (error) {
    adminError = toError(error);
  }

  return { submitterError, adminError };
}
