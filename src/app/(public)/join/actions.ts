"use server";

import { headers } from "next/headers";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { checkRateLimit } from "@/lib/rate-limit";
import { submitApplication } from "@/lib/intake/submit-application";
import { intakeFormSchema, type IntakeFormInput } from "@/lib/validation/schemas";

export type SubmitIntakeResult =
  | { success: true }
  | { success: false; error: string };

export async function submitIntakeForm(
  input: IntakeFormInput
): Promise<SubmitIntakeResult> {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") ?? "unknown";

  const { success: withinLimit } = await checkRateLimit(`${ip}:intake-form`, {
    limit: 5,
    windowMs: 10 * 60_000,
  });
  if (!withinLimit) {
    return { success: false, error: "Too many submissions. Please try again later." };
  }

  const parsed = intakeFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Please check the form and try again." };
  }

  const { chapterId } = await getTenantContext();
  const { error } = await submitApplication(chapterId, parsed.data);

  if (error) {
    return { success: false, error };
  }

  return { success: true };
}
