import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
}

const redis = Redis.fromEnv();

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
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

export async function checkRateLimit(
  key: string,
  opts: RateLimitOptions = { limit: 20, windowMs: 60_000 }
): Promise<RateLimitResult> {
  const { success } = await getLimiter(opts).limit(key);
  return { success };
}
