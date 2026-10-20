import "server-only";
import { Resend } from "resend";
import { getEmailFrom, getFormNotificationRecipients, getResendApiKey, getShoeProgramContactEmail } from "@/lib/email/config";

export async function sendShoeReservationNotifications(input: {
  to: string; name: string; phone?: string | undefined; reference: string; token: string;
  expiresAt: string; pairCount: number; deliveryMethod: "dropoff" | "coordinator";
}): Promise<boolean> {
  const key = getResendApiKey();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!key) return false;
  const resend = new Resend(key);
  const from = getEmailFrom();
  const expires = new Date(input.expiresAt).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "full", timeStyle: "short" });
  const contactEmail = getShoeProgramContactEmail();
  const recipients = getFormNotificationRecipients(contactEmail);
  const adminUrl = siteUrl ? new URL("/admin/shoes-for-kids", siteUrl).toString() : null;
  const directorText = `A sponsor reserved ${input.pairCount} ${input.pairCount === 1 ? "pair" : "pairs"} for Shoes for Kids.\n\nReservation: ${input.reference}\nSponsor: ${input.name}\nEmail: ${input.to}${input.phone ? `\nPhone: ${input.phone}` : ""}\nHandoff: ${input.deliveryMethod === "coordinator" ? "Coordinate with committee" : "Confirmed drop-off"}\nReservation expires: ${expires} Central Time.${adminUrl ? `\n\nReview the reservation: ${adminUrl}` : ""}\n\nPlease coordinate directly with the sponsor. Do not forward this notice outside the program team.`;
  let sponsorEmailSent = false;
  if (siteUrl) {
    const url = new URL(`/shoes-for-kids/manage/${input.token}`, siteUrl).toString();
    try {
      const result = await resend.emails.send({
        from, to: input.to,
        subject: `Shoes for Kids reservation ${input.reference}`,
        text: `Hello ${input.name},\n\nYour Shoes for Kids reservation is ${input.reference}. Deliver your shoes by ${expires} Central Time. Your reservation remains active until then.\n\nView your pairs and delivery instructions: ${url}\n\n${input.deliveryMethod === "coordinator" ? "A program team member will contact you to coordinate the handoff. Please wait for those details before delivering shoes." : "Please follow the confirmed drop-off instructions on your reservation page."}\n\nQuestions? Contact the Social Action director at ${contactEmail}.\n\nShoes must be new athletic shoes and match the selected size and width. Kid-friendly styles are encouraged.\n\nTau Sigma Charity Foundation`,
      });
      if (result.error) throw result.error;
      sponsorEmailSent = true;
    } catch (error) {
      console.error("[shoes-for-kids] confirmation email failed", error);
    }
  } else {
    console.error("[shoes-for-kids] confirmation email missing NEXT_PUBLIC_SITE_URL");
  }
  if (recipients.length) {
    try {
      const result = await resend.emails.send({
        from, to: recipients, replyTo: input.to,
        subject: `New Shoes for Kids reservation ${input.reference}`,
        text: directorText,
      });
      if (result.error) throw result.error;
    } catch (error) {
      console.error("[shoes-for-kids] program director email failed", error);
    }
  }
  return sponsorEmailSent;
}
