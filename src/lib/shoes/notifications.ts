import "server-only";
import { Resend } from "resend";
import { getEmailFrom, getResendApiKey } from "@/lib/email/config";

export async function sendShoeConfirmation(input: {
  to: string; name: string; reference: string; token: string; expiresAt: string;
}): Promise<boolean> {
  const key = getResendApiKey();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!key || !siteUrl) return false;
  const url = new URL(`/shoes-for-kids/manage/${input.token}`, siteUrl).toString();
  try {
    const result = await new Resend(key).emails.send({
      from: getEmailFrom(), to: input.to,
      subject: `Shoes for Kids reservation ${input.reference}`,
      text: `Hello ${input.name},\n\nYour Shoes for Kids reservation is ${input.reference}. It expires ${new Date(input.expiresAt).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "full", timeStyle: "short" })} Central Time.\n\nView your pairs and delivery instructions: ${url}\n\nShoes must be new and match the selected size, width, and style.\n\nTau Sigma Charity Foundation`,
    });
    if (result.error) throw result.error;
    return true;
  } catch (error) {
    console.error("[shoes-for-kids] confirmation email failed", error);
    return false;
  }
}
