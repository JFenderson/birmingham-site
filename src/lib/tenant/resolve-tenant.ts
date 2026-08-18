export interface ResolvedTenant {
  chapterId: string;
  chapterSlug: string;
}

interface TenantResolverOptions {
  nodeEnv: string | undefined;
  rootDomain: string;
  stagingHost?: string | undefined;
  slugMap: Readonly<Record<string, string>>;
}

const ROOT_SLUG = "root";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const VALID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeHostname(host: string | null): string | null {
  const value = host?.trim().toLowerCase();
  if (!value || /[,/\\\s]/.test(value)) return null;

  if (value.startsWith("[")) {
    const closingBracket = value.indexOf("]");
    if (closingBracket < 0) return null;
    const hostname = value.slice(1, closingBracket);
    const suffix = value.slice(closingBracket + 1);
    return !suffix || /^:\d+$/.test(suffix) ? hostname : null;
  }

  const colonCount = (value.match(/:/g) ?? []).length;
  if (colonCount > 1) return null;

  const hostname = colonCount === 1 ? value.slice(0, value.lastIndexOf(":")) : value;
  const port = colonCount === 1 ? value.slice(value.lastIndexOf(":") + 1) : "";
  if ((colonCount === 1 && !/^\d+$/.test(port)) || !hostname) return null;

  return hostname.endsWith(".") ? hostname.slice(0, -1) : hostname;
}

function getConfiguredTenant(
  slug: string,
  slugMap: Readonly<Record<string, string>>,
): ResolvedTenant | null {
  if (!VALID_SLUG.test(slug)) return null;
  const chapterId = slugMap[slug];
  return typeof chapterId === "string" && chapterId.trim()
    ? { chapterId, chapterSlug: slug }
    : null;
}

export function resolveTenant(
  host: string | null,
  searchParams: URLSearchParams,
  options: TenantResolverOptions,
): ResolvedTenant | null {
  const hostname = normalizeHostname(host);
  if (!hostname) return null;

  const isVercelPreview = hostname.endsWith(".vercel.app");
  const overrideAllowed = options.nodeEnv !== "production" || isVercelPreview;

  if (overrideAllowed) {
    const override = searchParams.get("__tenant")?.trim().toLowerCase();
    if (override) return getConfiguredTenant(override, options.slugMap);
  }

  const rootDomain = normalizeHostname(options.rootDomain);
  const stagingHost = normalizeHostname(options.stagingHost ?? null);
  if (options.nodeEnv !== "production" && LOCAL_HOSTS.has(hostname)) {
    return getConfiguredTenant(ROOT_SLUG, options.slugMap);
  }

  if (stagingHost && hostname === stagingHost) {
    return getConfiguredTenant(ROOT_SLUG, options.slugMap);
  }

  if (!rootDomain) {
    return LOCAL_HOSTS.has(hostname) || isVercelPreview
      ? getConfiguredTenant(ROOT_SLUG, options.slugMap)
      : null;
  }

  if (isVercelPreview || hostname === rootDomain || hostname === `www.${rootDomain}`) {
    return getConfiguredTenant(ROOT_SLUG, options.slugMap);
  }

  if (!hostname.endsWith(`.${rootDomain}`)) return null;

  const slug = hostname.slice(0, -(rootDomain.length + 1));
  return getConfiguredTenant(slug, options.slugMap);
}
