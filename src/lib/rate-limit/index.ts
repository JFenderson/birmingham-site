import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimitOptions {
  limit: number;
  windowMs: number;
  /**
   * Whether to treat the request as allowed (`true`) when the Upstash
   * backend is unreachable (e.g. missing credentials or a Redis outage).
   * Defaults to `false` (fail closed) so unauthenticated, write-triggering
   * call sites don't open a spam window during an outage.
   */
  failOpen?: boolean;
}

interface RateLimitResult {
  success: boolean;
}

// Reduce retry attempts so an outage or credential misconfiguration fails
// fast (~tens of ms) instead of hanging for the default ~4.3s of exponential
// backoff across 5 retries.
const redis = Redis.fromEnv({ retry: { retries: 1 } });

// Cache one Ratelimit instance per distinct (limit, windowMs) pair rather
// than constructing a new one per call.
const limiters = new Map<string, Ratelimit>();

function getLimiter(opts: RateLimitOptions): Ratelimit {
  const cacheKey = `${opts.limit}:${opts.windowMs}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(opts.limit, `${opts.windowMs} ms`),
      // Isolate rate-limit counters per environment so local/preview
      // testing can't exhaust a real applicant's production bucket when
      // all environments share one linked Upstash database.
      prefix: `rl:${process.env.VERCEL_ENV ?? "dev"}`,
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

export async function checkRateLimit(
  key: string,
  opts: RateLimitOptions = { limit: 20, windowMs: 60_000 }
): Promise<RateLimitResult> {
  try {
    const { success } = await getLimiter(opts).limit(key);
    return { success };
  } catch (err) {
    console.error("[rate-limit] backend unavailable", err);
    return { success: opts.failOpen === true };
  }
}
