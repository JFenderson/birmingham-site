"use server";

import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendSigmaBetaInterestNotification } from "@/lib/email/send-sigma-beta-interest-notification";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";
import {
  sigmaBetaInterestSchema,
  type SigmaBetaInterestInput,
  type SigmaBetaInterestRole,
} from "@/lib/validation/schemas";

export type SigmaBetaInterestResult =
  | { success: true; message: string }
  | { success: false; error: string };

export const NEUTRAL_SIGMA_BETA_INTEREST_RESULT: SigmaBetaInterestResult = {
  success: true,
  message: "Thanks for reaching out. A Sigma Beta Club advisor will follow up soon.",
};

const SIGMA_BETA_ROLE_LABELS: Record<SigmaBetaInterestRole, string> = {
  student: "Student",
  parent_guardian: "Parent/Guardian",
  other: "Other",
};

export const sigmaBetaInterestActionDependencies = {
  checkRateLimit,
  headers,
  getCurrentChapter,
  sendSigmaBetaInterestNotification,
};

function getClientIp(headerList: Headers): string {
  return (
    headerList
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim() || "unknown"
  );
}

function toSigmaBetaInterestInput(input: SigmaBetaInterestInput | FormData): unknown {
  if (input instanceof FormData) {
    return {
      name: input.get("name"),
      email: input.get("email"),
      phone: input.get("phone"),
      role: input.get("role"),
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

export async function submitSigmaBetaInterest(
  input: SigmaBetaInterestInput | FormData,
): Promise<SigmaBetaInterestResult> {
  const headerList = await sigmaBetaInterestActionDependencies.headers();
  const ip = getClientIp(headerList);
  const { success: withinLimit } =
    await sigmaBetaInterestActionDependencies.checkRateLimit(
      `${ip}:sigma-beta-interest`,
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

  const raw = toSigmaBetaInterestInput(input);

  // Bots that fill the hidden honeypot field get the same neutral success
  // message as real submitters, with no notification sent and no signal
  // that they were caught.
  if (isHoneypotTripped(raw)) {
    return NEUTRAL_SIGMA_BETA_INTEREST_RESULT;
  }

  const parsed = sigmaBetaInterestSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Please check the form and try again." };
  }

  const chapter = await sigmaBetaInterestActionDependencies.getCurrentChapter();

  await sigmaBetaInterestActionDependencies.sendSigmaBetaInterestNotification({
    to: parsed.data.email,
    submitterName: parsed.data.name,
    submitterEmail: parsed.data.email,
    chapterName: chapter.name,
    roleLabel: SIGMA_BETA_ROLE_LABELS[parsed.data.role],
    message: parsed.data.message || undefined,
  });

  return NEUTRAL_SIGMA_BETA_INTEREST_RESULT;
}

export async function submitSigmaBetaInterestFormAction(
  _previousState: SigmaBetaInterestResult,
  formData: FormData,
): Promise<SigmaBetaInterestResult> {
  return submitSigmaBetaInterest(formData);
}
