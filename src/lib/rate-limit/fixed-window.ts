type CounterStore = {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
};

export function isScriptPermissionError(error: unknown): boolean {
  return error instanceof Error && /NOPERM.*\bevalsha\b/i.test(error.message);
}

/** Fallback for Redis ACL users that can count requests but cannot run scripts. */
export async function checkFixedWindowLimit(
  store: CounterStore,
  key: string,
  limit: number,
  windowMs: number,
  environment: string,
  now = Date.now(),
): Promise<boolean> {
  const bucket = Math.floor(now / windowMs);
  const counterKey = `rl:${environment}:fixed:${limit}:${windowMs}:${bucket}:${key}`;
  const count = await store.incr(counterKey);
  // Bucket names change at the window boundary, so resetting the TTL here
  // does not extend the period in which this count can reject requests.
  await store.expire(counterKey, Math.max(1, Math.ceil((windowMs * 2) / 1000)));
  return count <= limit;
}
