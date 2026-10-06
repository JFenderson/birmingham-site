import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendSigmaBetaInterestNotification } from "@/lib/email/send-sigma-beta-interest-notification";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";
import { storeSigmaBetaInterest } from "@/lib/sigma-beta/store-interest";

export const NEUTRAL_SIGMA_BETA_INTEREST_RESULT = {
  success: true as const,
  message: "Thank you for your interest in the Tau Sigma Chapter Sigma Beta Club. Your information has been received. A member of our Sigma Beta Club leadership team will contact the parent or guardian regarding upcoming activities and the next intake cycle.",
};

export const sigmaBetaInterestActionDependencies = {
  checkRateLimit,
  headers,
  getCurrentChapter,
  sendSigmaBetaInterestNotification,
  storeSigmaBetaInterest,
};
