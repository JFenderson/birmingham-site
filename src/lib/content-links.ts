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

const UNSAFE_URL_CHARACTERS_PATTERN = new RegExp(
  "[" +
    String.fromCharCode(0) +
    "-" +
    String.fromCharCode(31) +
    String.fromCharCode(127) +
    "\\\\]",
);

export function isSafeContentActionHref(value: string): boolean {
  const href = value.trim();

  if (href.length === 0 || UNSAFE_URL_CHARACTERS_PATTERN.test(href)) return false;

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

/**
 * A safe-URL check for destinations that are not part of the approved
 * external content-action host allowlist (for example third-party event
 * registration forms). Accepts an internal path beginning with "/" or any
 * HTTPS URL; rejects other schemes, protocol-relative "//" URLs, and control
 * characters. Used directly by `createSafeExternalUrlField` in
 * `src/sanity/schema/shared.ts` and by public content components — the
 * single source of truth for this check.
 */
export function isSafeExternalUrl(value: string): boolean {
  const href = value.trim();

  if (href.length === 0 || UNSAFE_URL_CHARACTERS_PATTERN.test(href)) return false;

  if (href.startsWith("/")) {
    return !href.startsWith("//");
  }

  try {
    const url = new URL(href);

    return url.protocol === "https:";
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
