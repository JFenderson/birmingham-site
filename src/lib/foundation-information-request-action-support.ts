import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendFoundationInformationRequestNotification } from "@/lib/email/send-foundation-information-request-notification";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";

export const NEUTRAL_FOUNDATION_INFORMATION_REQUEST_RESULT = {
  success: true as const,
  message: "Thanks for reaching out. A foundation representative will follow up soon.",
};

export const foundationInformationRequestActionDependencies = {
  checkRateLimit,
  headers,
  getCurrentChapter,
  sendFoundationInformationRequestNotification,
};
