import "server-only";
import { Resend } from "resend";
import { estimateStepsFromMiles, type InitiativeSubmission } from "@/lib/initiatives/tracker";
import {
  getBbbDirectorEmail,
  getEmailFrom,
  getFormNotificationRecipients,
  getResendApiKey,
  getSocialActionDirectorEmail,
} from "./config";

export async function sendInitiativeSubmissionNotification(entry: InitiativeSubmission) {
  const key = getResendApiKey();
  if (!key) {
    console.error("[initiative] notification skipped: RESEND_API_KEY is missing");
    return;
  }

  const isBlackSpending = entry.initiative === "black_spending";
  const recipients = getFormNotificationRecipients(
    isBlackSpending ? getBbbDirectorEmail() : getSocialActionDirectorEmail(),
  );
  const program = isBlackSpending ? "BBB Black Spending" : "Social Action Daily Steps";
  const details = isBlackSpending
    ? [
        `Business: ${entry.businessName}`,
        `Amount: $${(entry.amountCents / 100).toFixed(2)}`,
        `Date: ${entry.spentOn}`,
      ]
    : [
        `Steps: ${entry.steps ?? estimateStepsFromMiles(entry.distanceMiles ?? 0)}`,
        ...(entry.distanceMiles === undefined ? [] : [`Miles: ${entry.distanceMiles}`]),
        `Date: ${entry.trackedOn}`,
      ];
  const duration = (entry.durationHours ?? 0) * 60 + (entry.durationMinutes ?? 0);
  if (duration) details.push(`Time spent: ${duration} minutes`);

  try {
    const result = await new Resend(key).emails.send({
      from: getEmailFrom(),
      to: recipients,
      subject: `New ${program} entry`,
      text: [
        `A ${program} entry was submitted for review.`,
        "",
        `Submitted by: ${entry.firstName} ${entry.lastName}`,
        ...details,
        "",
        "Review the supporting evidence in the chapter admin portal.",
      ].join("\n"),
    });
    if (result.error) throw result.error;
  } catch (error) {
    console.error("[initiative] notification failed", error);
  }
}
