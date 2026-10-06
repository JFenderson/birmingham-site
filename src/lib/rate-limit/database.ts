import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export function isScriptPermissionError(error: unknown): boolean {
  return error instanceof Error && /NOPERM.*\bevalsha\b/i.test(error.message);
}

export function hashRateLimitKey(
  key: string,
  limit: number,
  windowMs: number,
  environment: string,
): string {
  return createHash("sha256")
    .update(`${environment}:${limit}:${windowMs}:${key}`)
    .digest("hex");
}

/** Use a private database counter when the configured Redis token is read-only. */
export async function checkDatabaseRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  environment: string,
): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc(
    "check_request_rate_limit" as never,
    {
      p_key_hash: hashRateLimitKey(key, limit, windowMs, environment),
      p_limit: limit,
      p_window_ms: windowMs,
    } as never,
  );
  if (error) throw error;
  if (typeof data !== "boolean") {
    throw new Error("Rate-limit database returned an invalid response.");
  }
  return data;
}
