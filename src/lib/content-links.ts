import type { SanityContentAction } from "../sanity/queries.ts";

const APPROVED_EXTERNAL_CONTENT_ACTION_HOSTS = new Set([
  "alabamasigmas.org",
  "birminghamal.gov",
  "phibetasigma1914.org",
  "pbssouthern.org",
  "www.alabamasigmas.org",
  "www.birminghamal.gov",
  "www.phibetasigma1914.org",
  "www.pbssouthern.org",
]);

export function isSafeContentActionHref(value: string): boolean {
  const href = value.trim();

  if (href.length === 0 || /[\u0000-\u001f\u007f\\]/.test(href)) return false;

  if (href.startsWith("/")) {
    return !href.startsWith("//");
  }

  try {
    const url = new URL(href);

    return (
      url.protocol === "https:" &&
      APPROVED_EXTERNAL_CONTENT_ACTION_HOSTS.has(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

export function sanitizeContentAction(
  value: SanityContentAction | null | undefined,
): SanityContentAction | null {
  if (
    typeof value?.href !== "string" ||
    typeof value.label !== "string" ||
    value.label.trim().length === 0 ||
    !isSafeContentActionHref(value.href)
  ) {
    return null;
  }

  return { href: value.href.trim(), label: value.label.trim() };
}
