"use server";

import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendFoundationInformationRequestNotification } from "@/lib/email/send-foundation-information-request-notification";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";
import {
  foundationInformationRequestSchema,
  type FoundationInformationRequestInput,
} from "@/lib/validation/schemas";

export type FoundationInformationRequestResult =
  | { success: true; message: string }
  | { success: false; error: string };

export const NEUTRAL_FOUNDATION_INFORMATION_REQUEST_RESULT: FoundationInformationRequestResult = {
  success: true,
  message: "Thanks for reaching out. A foundation representative will follow up soon.",
};

export const foundationInformationRequestActionDependencies = {
  checkRateLimit,
  headers,
  getCurrentChapter,
  sendFoundationInformationRequestNotification,
};

function getClientIp(headerList: Headers): string {
  return (
    headerList
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim() || "unknown"
  );
}

function toFoundationInformationRequestInput(
  input: FoundationInformationRequestInput | FormData,
): unknown {
  if (input instanceof FormData) {
    return {
      name: input.get("name"),
      email: input.get("email"),
      organization: input.get("organization"),
      phone: input.get("phone"),
      message: input.get("message"),
      website: input.get("website"),
    };
  }

  return input;
}

function isHoneypotTripped(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const value = (raw as { website?: unknown }).website;
  return typeof value === "string" && value.trim().length > 0;
}

export async function submitFoundationInformationRequest(
  input: FoundationInformationRequestInput | FormData,
): Promise<FoundationInformationRequestResult> {
  const headerList = await foundationInformationRequestActionDependencies.headers();
  const ip = getClientIp(headerList);
  const { success: withinLimit } =
    await foundationInformationRequestActionDependencies.checkRateLimit(
      `${ip}:foundation-info-request`,
      {
        limit: 5,
        windowMs: 10 * 60_000,
      },
    );

  if (!withinLimit) {
    return {
      success: false,
      error: "Too many submissions. Please try again later.",
    };
  }

  const raw = toFoundationInformationRequestInput(input);

  // Bots that fill the hidden honeypot field get the same neutral success
  // message as real submitters, with no notification sent and no signal
  // that they were caught.
  if (isHoneypotTripped(raw)) {
    return NEUTRAL_FOUNDATION_INFORMATION_REQUEST_RESULT;
  }

  const parsed = foundationInformationRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Please check the form and try again." };
  }

  const chapter = await foundationInformationRequestActionDependencies.getCurrentChapter();

  await foundationInformationRequestActionDependencies.sendFoundationInformationRequestNotification({
    to: parsed.data.email,
    submitterName: parsed.data.name,
    submitterEmail: parsed.data.email,
    nonprofitName: chapter.name,
    organization: parsed.data.organization || undefined,
    message: parsed.data.message,
  });

  return NEUTRAL_FOUNDATION_INFORMATION_REQUEST_RESULT;
}

export async function submitFoundationInformationRequestFormAction(
  _previousState: FoundationInformationRequestResult,
  formData: FormData,
): Promise<FoundationInformationRequestResult> {
  return submitFoundationInformationRequest(formData);
}
