import { isSafeExternalUrl } from "./content-links.ts";

/**
 * Gates the donation destination behind the same safe-URL check used for
 * other Sanity-managed external links (`isSafeExternalUrl`). Returns null
 * for missing/blank/unsafe values so callers can skip rendering a donate
 * link entirely rather than pointing at an unvetted destination. Donation
 * processing itself always happens on the external destination this URL
 * points to — this component never collects payment details.
 */
export function getSafeDonationHref(url: string | null | undefined): string | null {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return isSafeExternalUrl(trimmed) ? trimmed : null;
}
