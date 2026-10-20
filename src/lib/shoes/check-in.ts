const checkInCodePattern = /^SFK-CI:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export function parseShoeCheckInCode(value: string): string | null {
  const raw = value.trim();
  if (checkInCodePattern.test(raw)) return raw;
  try {
    const url = new URL(raw);
    if (url.pathname !== "/shoes-for-kids/check-in") return null;
    const code = url.searchParams.get("code");
    return code && checkInCodePattern.test(code) ? code : null;
  } catch {
    return null;
  }
}

export function shoeCheckInUrl(code: string, origin: string): string {
  const url = new URL("/shoes-for-kids/check-in", origin);
  url.searchParams.set("code", code);
  return url.toString();
}
