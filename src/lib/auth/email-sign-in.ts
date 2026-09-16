import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getTrustedSiteOrigin } from "@/lib/security/redirects";

export const emailSignInDependencies = { headers, checkRateLimit, getTrustedSiteOrigin, createClient };

export async function sendEmailSignInLink(email: unknown) {
  const parsed = z.string().trim().email().max(254).toLowerCase().safeParse(email);
  if (!parsed.success) return "Please enter a valid email address.";
  const ip = (await emailSignInDependencies.headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const recipient = createHash("sha256").update(parsed.data).digest("hex");
  const limits = await Promise.all([
    emailSignInDependencies.checkRateLimit(`login-link:ip:${ip}`, { limit: 5, windowMs: 10 * 60_000 }),
    emailSignInDependencies.checkRateLimit(`login-link:email:${recipient}`, { limit: 3, windowMs: 10 * 60_000 }),
  ]);
  if (limits.some((limit) => !limit.success)) return "Please wait a few minutes before requesting another link.";
  const origin = emailSignInDependencies.getTrustedSiteOrigin();
  if (!origin) return "Email sign-in is temporarily unavailable. Please try your password.";
  try {
    const supabase = await emailSignInDependencies.createClient();
    await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: { shouldCreateUser: false, emailRedirectTo: `${origin}/auth/sign-in` },
    });
  } catch {
    return "Email sign-in is temporarily unavailable. Please try again later.";
  }
  // Do not reveal whether the email belongs to an account. Portal approval is separate.
  return "If you have a member account, check your email for a sign-in link. You can close this page after opening the link.";
}

