interface RateLimitOptions {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
}

// Naive single-instance fixed-window counter. Fine for Phase 1: no public
// form endpoints ship yet, so there's no real abuse surface to defend.
//
// PHASE 2+: swap this file's internals for @upstash/ratelimit's
// Ratelimit.slidingWindow(), keyed the same way (see checkRateLimit below).
// No call sites need to change — they only see { success }.
const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Keys should combine the caller's IP (x-forwarded-for) with a route name,
 * e.g. `${ip}:intake-form-submit`, so limits are scoped per endpoint.
 */
export async function checkRateLimit(
  key: string,
  opts: RateLimitOptions = { limit: 20, windowMs: 60_000 }
): Promise<RateLimitResult> {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { success: true };
  }

  if (bucket.count >= opts.limit) {
    return { success: false };
  }

  bucket.count += 1;
  return { success: true };
}
