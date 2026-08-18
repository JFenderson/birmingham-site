const DEFAULT_LOGIN_REDIRECT = "/dashboard";

export function resolveSafeLoginRedirect(
  rawRedirect: string | null | undefined,
  fallback = DEFAULT_LOGIN_REDIRECT,
): string {
  if (!rawRedirect || !rawRedirect.startsWith("/") || rawRedirect.startsWith("//")) {
    return fallback;
  }

  try {
    const resolved = new URL(rawRedirect, "https://local.invalid");
    if (resolved.origin !== "https://local.invalid") return fallback;
    return resolved.pathname + resolved.search + resolved.hash;
  } catch {
    return fallback;
  }
}

export interface TrustedSiteOriginOptions {
  siteUrl?: string | undefined;
  rootDomain?: string | undefined;
  stagingHost?: string | undefined;
  nodeEnv?: string | undefined;
}

function originFromUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function originFromHost(host: string | undefined, nodeEnv: string | undefined): string | null {
  const normalized = host?.trim().toLowerCase().replace(/\.$/, "");
  if (!normalized || /[,/\\\s]/.test(normalized)) return null;
  const protocol =
    nodeEnv !== "production" && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)
      ? "http"
      : "https";
  try {
    return new URL(`${protocol}://${normalized}`).origin;
  } catch {
    return null;
  }
}

export function getTrustedSiteOrigin(options: TrustedSiteOriginOptions = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  rootDomain: process.env.ROOT_DOMAIN,
  stagingHost: process.env.STAGING_HOST,
  nodeEnv: process.env.NODE_ENV,
}): string | null {
  return (
    originFromUrl(options.siteUrl) ??
    originFromHost(options.stagingHost, options.nodeEnv) ??
    originFromHost(options.rootDomain, options.nodeEnv) ??
    (options.nodeEnv !== "production" ? "http://localhost:3000" : null)
  );
}
