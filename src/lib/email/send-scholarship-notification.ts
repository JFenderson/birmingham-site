import { Resend } from "resend";
import { getEmailFrom, getEducationDirectorEmail, getFormNotificationRecipients } from "./config";

export async function sendScholarshipNotification(params: { applicantEmail: string; applicantName: string; applicationId: string; }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = getEmailFrom();
  const recipients = getFormNotificationRecipients(getEducationDirectorEmail());
  const results = await Promise.allSettled([
    resend.emails.send({ from, to: params.applicantEmail, subject: "Scholarship application received", text: `Thank you ${params.applicantName}. We received your Tau Sigma Sapphire Scholarship application and will contact you soon.` }),
    resend.emails.send({ from, to: recipients, subject: "New Tau Sigma Sapphire Scholarship application", text: `A new scholarship application was submitted by ${params.applicantName}. Application ID: ${params.applicationId}` }),
  ]);
  for (const result of results) {
    if (result.status === "rejected") console.error("[scholarship] notification failed", result.reason);
    else if (result.value.error) console.error("[scholarship] notification failed", result.value.error);
  }
}
