import { Resend } from "resend";
import {
  getEmailFrom,
  getResendApiKey,
  getSigmaBetaAdminEmail,
} from "./config.ts";

export type SigmaBetaInterestNotificationParams = {
  to: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  studentName: string;
  studentAge: number;
  gradeLevel: string;
  studentSchool: string;
  chapterName: string;
  referralSource?: string | undefined;
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
  params: Pick<SigmaBetaInterestNotificationParams, "parentName" | "chapterName">,
) {
  const parentName = toPlainTextLine(params.parentName);
  const chapterName = toPlainTextLine(params.chapterName) || "the chapter";

  return {
    subject: "Thanks for Your Interest — Sigma Beta Club",
    text: [
      `Hi ${parentName},`,
      "",
      `Thank you for your interest in the ${chapterName} Sigma Beta Club. Your information has been received.`,
      "An interest form does not constitute membership or acceptance. A member of our Sigma Beta Club leadership team will contact the parent or guardian about upcoming activities and the next intake cycle.",
    ].join("\n"),
  };
}

function getAdminContent(params: SigmaBetaInterestNotificationParams) {
  const parentName = toPlainTextLine(params.parentName);
  const parentEmail = toPlainTextLine(params.parentEmail);
  const parentPhone = toPlainTextLine(params.parentPhone);
  const studentName = toPlainTextLine(params.studentName);
  const studentSchool = toPlainTextLine(params.studentSchool);
  const chapterName = toPlainTextLine(params.chapterName) || "the chapter";
  const referralSource = params.referralSource ? toPlainTextLine(params.referralSource) : "";
  const message = params.message ? toPlainTextLine(params.message) : "";

  return {
    subject: "New Sigma Beta Club Interest Submission",
    text: [
      "New Sigma Beta Club interest submission",
      "",
      `Chapter: ${chapterName}`,
      `Parent/Guardian: ${parentName}`,
      `Email: ${parentEmail}`,
      `Phone: ${parentPhone}`,
      `Student: ${studentName}`,
      `Age: ${params.studentAge}`,
      `Grade: ${params.gradeLevel}`,
      `School: ${studentSchool}`,
      ...(referralSource ? [`Heard about us: ${referralSource}`] : []),
      ...(message ? ["", `Questions / additional information: ${message}`] : []),
      "",
      "Follow up with the parent or guardian. This is an interest submission, not a membership application.",
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
        parentName: params.parentName,
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
        parentName: params.parentName,
        parentEmail: params.parentEmail,
        parentPhone: params.parentPhone,
        studentName: params.studentName,
        studentAge: params.studentAge,
        gradeLevel: params.gradeLevel,
        studentSchool: params.studentSchool,
        chapterName: params.chapterName,
        referralSource: params.referralSource,
        message: params.message,
      }),
    });
    throwIfResendError(result);
  } catch (error) {
    adminError = toError(error);
  }

  return { submitterError, adminError };
}
