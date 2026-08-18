export type InterestFormNotificationContentParams = {
  applicantName: string;
  applicantEmail: string;
  chapterName: string;
  formTypeLabel: string;
};

function toSingleLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function toPlainTextLine(value: string) {
  return toSingleLine(value).replace(/[<>]/g, "");
}

export function getApplicantInterestNotificationContent(
  params: Pick<
    InterestFormNotificationContentParams,
    "applicantName" | "chapterName" | "formTypeLabel"
  >,
) {
  const applicantName = toPlainTextLine(params.applicantName);
  const chapterName = toPlainTextLine(params.chapterName) || "the chapter";
  const formTypeLabel = toPlainTextLine(params.formTypeLabel);

  return {
    subject: `${formTypeLabel} Submission Received`,
    summary: `Hi ${applicantName}, thank you for your ${formTypeLabel.toLowerCase()} submission to ${chapterName}.`,
    text: [
      `Hi ${applicantName},`,
      "",
      `Your ${formTypeLabel.toLowerCase()} submission was received by ${chapterName}.`,
      "A chapter officer will follow up soon.",
    ].join("\n"),
  };
}

export function getAdminInterestNotificationContent(
  params: InterestFormNotificationContentParams,
) {
  const applicantName = toPlainTextLine(params.applicantName);
  const applicantEmail = toPlainTextLine(params.applicantEmail);
  const chapterName = toPlainTextLine(params.chapterName) || "the chapter";
  const formTypeLabel = toPlainTextLine(params.formTypeLabel);

  return {
    subject: `New ${formTypeLabel} Submission`,
    summary: `${applicantName} submitted a ${formTypeLabel.toLowerCase()} form for ${chapterName}. Reply to ${applicantEmail} to follow up.`,
    text: [
      `New ${formTypeLabel} submission`,
      "",
      `Chapter: ${chapterName}`,
      `Applicant: ${applicantName}`,
      `Email: ${applicantEmail}`,
      "",
      "Follow up with the applicant directly.",
    ].join("\n"),
  };
}
