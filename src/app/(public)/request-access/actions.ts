"use server";

import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { requestRootMemberAccess } from "@/lib/members/request-access";
import { getTrustedSiteOrigin } from "@/lib/security/redirects";
import { ROOT_SLUG } from "@/lib/tenant/constants";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import {
  requestAccessSchema,
  type RequestAccessInput,
} from "@/lib/validation/schemas";

export type RequestAccessResult =
  | { success: true; message: string }
  | { success: false; error: string };

export const NEUTRAL_REQUEST_ACCESS_RESULT: RequestAccessResult = {
  success: true,
  message:
    "If your information matches the Tau Sigma roster, check your email for the next step.",
};

export const requestAccessActionDependencies = {
  checkRateLimit,
  getTenantContext,
  headers,
  requestRootMemberAccess,
  getTrustedSiteOrigin,
};

function getClientIp(headerList: Headers): string {
  return (
    headerList
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim() || "unknown"
  );
}

function toRequestAccessInput(input: RequestAccessInput | FormData): unknown {
  if (input instanceof FormData) {
    return {
      email: input.get("email"),
      fullName: input.get("fullName"),
      lastName: input.get("lastName"),
      membershipNumber: input.get("membershipNumber"),
    };
  }

  return input;
}

export async function requestMemberAccess(
  input: RequestAccessInput | FormData,
): Promise<RequestAccessResult> {
  const headerList = await requestAccessActionDependencies.headers();
  const ip = getClientIp(headerList);
  const { success: withinLimit } =
    await requestAccessActionDependencies.checkRateLimit(
      `${ip}:request-access`,
      {
        limit: 5,
        windowMs: 10 * 60_000,
      },
    );

  if (!withinLimit) {
    return {
      success: false,
      error: "Too many requests. Please try again later.",
    };
  }

  const parsed = requestAccessSchema.safeParse(toRequestAccessInput(input));
  if (!parsed.success) return NEUTRAL_REQUEST_ACCESS_RESULT;

  const { chapterId, chapterSlug } =
    await requestAccessActionDependencies.getTenantContext();
  if (chapterSlug !== ROOT_SLUG) return NEUTRAL_REQUEST_ACCESS_RESULT;

  const siteOrigin = requestAccessActionDependencies.getTrustedSiteOrigin();
  if (!siteOrigin) return NEUTRAL_REQUEST_ACCESS_RESULT;
  const redirectTo = `${siteOrigin}/auth/confirm?next=${encodeURIComponent("/accept-invite")}`;

  await requestAccessActionDependencies.requestRootMemberAccess({
    chapterId,
    email: parsed.data.email,
    fullName: parsed.data.fullName,
    lastName: parsed.data.lastName,
    membershipNumber: parsed.data.membershipNumber,
    redirectTo,
  });

  return NEUTRAL_REQUEST_ACCESS_RESULT;
}

export async function requestMemberAccessFormAction(
  _previousState: RequestAccessResult,
  formData: FormData,
): Promise<RequestAccessResult> {
  return requestMemberAccess(formData);
}
