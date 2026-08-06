"use server";

import { headers } from "next/headers";

import { requireRole } from "@/lib/auth/rbac";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { ROOT_SLUG } from "@/lib/tenant/constants";
import { provisionMemberInvite } from "@/lib/members/invite-member";
import { inviteMemberSchema } from "@/lib/validation/schemas";

const INVITE_ROLES = ["Admin", "Secretary", "Intake Director"] as const;

export async function inviteMember(
  input: Record<string, unknown>
): Promise<{ error: string | null }> {
  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }

  const { chapterId } = await requireRole(INVITE_ROLES);
  const { chapterSlug } = await getTenantContext();

  // Build the invite redirect host from the already-validated tenant slug
  // (resolved server-side against the configured CHAPTER_SLUG_MAP) rather
  // than the raw Host header — trusting that header directly for a link
  // embedded in an email is a host-header-injection / invite-token-theft
  // risk, the same class as the well-known "password reset poisoning" bug.
  const rootDomain = process.env.ROOT_DOMAIN;
  const isLocal = !process.env.VERCEL_ENV;
  let host: string;

  if (rootDomain) {
    host = chapterSlug === ROOT_SLUG ? rootDomain : `${chapterSlug}.${rootDomain}`;
    if (isLocal) {
      const port = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").port;
      if (port) host += `:${port}`;
    }
  } else {
    // No ROOT_DOMAIN configured (e.g. a Vercel preview *.vercel.app
    // deployment, per resolveTenantFromRequest's own fallback) — the
    // shared vercel.app host is the only option there. Still validated
    // against a fixed suffix, not trusted verbatim.
    const headerList = await headers();
    const rawHost = headerList.get("host") ?? "";
    host = rawHost.endsWith(".vercel.app") ? rawHost : "";
  }

  if (!host) {
    return { error: "Could not determine invite link — site configuration is incomplete." };
  }

  const protocol = isLocal ? "http" : "https";
  const redirectTo = `${protocol}://${host}/auth/confirm?next=${encodeURIComponent("/accept-invite")}`;

  return provisionMemberInvite({
    chapterId,
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    redirectTo,
  });
}
