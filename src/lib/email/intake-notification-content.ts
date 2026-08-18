export type InterestFormNotificationContentParams = {
  applicantName: string;
  applicantEmail: string;
  chapterName: string;
  formTypeLabel: string;
};

export function getApplicantInterestNotificationContent(
  params: Pick<
    InterestFormNotificationContentParams,
    "applicantName" | "chapterName" | "formTypeLabel"
  >,
) {
  return {
    subject: `${params.formTypeLabel} Submission Received`,
    summary: `Hi ${params.applicantName}, thank you for your ${params.formTypeLabel.toLowerCase()} submission to ${params.chapterName}.`,
  };
}

export function getAdminInterestNotificationContent(
  params: InterestFormNotificationContentParams,
) {
  return {
    subject: `New ${params.formTypeLabel} Submission`,
    summary: `${params.applicantName} submitted a ${params.formTypeLabel.toLowerCase()} form for ${params.chapterName}. Reply to ${params.applicantEmail} to follow up.`,
  };
}
