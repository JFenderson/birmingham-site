import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "./client.ts";

const builder = createImageUrlBuilder(sanityClient);

/**
 * Builds a Sanity image URL, guarding against `@sanity/image-url`'s builder
 * throwing on a malformed/unresolvable image source. Returns null on
 * failure so callers can omit the image rather than crash the page render —
 * matching the plan's "omit if runtime content is invalid" requirement.
 */
export function getSanityImageUrl(
  source: SanityImageSource,
  width: number,
  height: number,
): string | null {
  try {
    return builder.image(source).width(width).height(height).fit("crop").url();
  } catch {
    return null;
  }
}
