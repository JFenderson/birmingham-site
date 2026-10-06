"use server";

import {
  NEUTRAL_SIGMA_BETA_INTEREST_RESULT,
  sigmaBetaInterestActionDependencies,
} from "@/lib/sigma-beta/interest-action-support";
import {
  sigmaBetaInterestSchema,
  sigmaBetaReferralLabels,
  type SigmaBetaInterestInput,
} from "@/lib/validation/schemas";

export type SigmaBetaInterestResult =
  | { success: true; message: string }
  | { success: false; error: string };

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
      parentName: input.get("parentName"),
      parentEmail: input.get("parentEmail"),
      parentPhone: input.get("parentPhone"),
      studentName: input.get("studentName"),
      studentAge: input.get("studentAge"),
      gradeLevel: input.get("gradeLevel"),
      studentSchool: input.get("studentSchool"),
      referralSource: input.get("referralSource"),
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

  try {
    await sigmaBetaInterestActionDependencies.storeSigmaBetaInterest(chapter.chapterId, parsed.data);
  } catch (error) {
    console.error("[sigma-beta-interest] storage failed", error);
    return { success: false, error: "We couldn't save your interest form right now. Please try again later." };
  }

  try {
    const { submitterError, adminError } =
      await sigmaBetaInterestActionDependencies.sendSigmaBetaInterestNotification({
        to: parsed.data.parentEmail,
        parentName: parsed.data.parentName,
        parentEmail: parsed.data.parentEmail,
        parentPhone: parsed.data.parentPhone,
        studentName: parsed.data.studentName,
        studentAge: parsed.data.studentAge,
        gradeLevel: parsed.data.gradeLevel,
        studentSchool: parsed.data.studentSchool,
        chapterName: chapter.chapterSlug === "root" ? "Tau Sigma Chapter" : chapter.name,
        referralSource: parsed.data.referralSource ? sigmaBetaReferralLabels[parsed.data.referralSource] : undefined,
        message: parsed.data.message || undefined,
      });
    if (submitterError || adminError) {
      console.error("[sigma-beta-interest] notification failed", { submitterError, adminError });
    }
  } catch (error) {
    console.error("[sigma-beta-interest] notification failed", error);
  }

  return chapter.chapterSlug === "root"
    ? NEUTRAL_SIGMA_BETA_INTEREST_RESULT
    : {
        success: true,
        message: `Thank you for your interest in the ${chapter.name} Sigma Beta Club. Your information has been received. A member of our Sigma Beta Club leadership team will contact the parent or guardian regarding upcoming activities and the next intake cycle.`,
      };
}

export async function submitSigmaBetaInterestFormAction(
  _previousState: SigmaBetaInterestResult,
  formData: FormData,
): Promise<SigmaBetaInterestResult> {
  return submitSigmaBetaInterest(formData);
}
