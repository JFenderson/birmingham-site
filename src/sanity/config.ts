const SANITY_API_VERSION = "2026-01-01";
const SANITY_DEFAULT_DATASET = "production";

type SanityEnv = Partial<
  Record<
    | "NEXT_PUBLIC_SANITY_PROJECT_ID"
    | "SANITY_PROJECT_ID"
    | "NEXT_PUBLIC_SANITY_DATASET"
    | "SANITY_DATASET"
    | "NODE_ENV",
    string
  >
>;

function resolveDataset(env: SanityEnv): string {
  return (
    env.NEXT_PUBLIC_SANITY_DATASET ??
    env.SANITY_DATASET ??
    SANITY_DEFAULT_DATASET
  );
}

function resolveProjectId(env: SanityEnv): string | undefined {
  return env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? env.SANITY_PROJECT_ID;
}

export function getSanityClientConfig(env: SanityEnv = process.env) {
  const projectId = resolveProjectId(env);

  if (!projectId) {
    throw new Error(
      "Sanity is not configured. Set NEXT_PUBLIC_SANITY_PROJECT_ID (or SANITY_PROJECT_ID for server-side local development).",
    );
  }

  return {
    projectId,
    dataset: resolveDataset(env),
    apiVersion: SANITY_API_VERSION,
    useCdn: env.NODE_ENV === "production",
  };
}

export function getSanityStudioConfig(env: SanityEnv = process.env) {
  const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID;

  if (!projectId) {
    throw new Error(
      "Sanity Studio requires NEXT_PUBLIC_SANITY_PROJECT_ID so /studio can load in the browser.",
    );
  }

  return {
    projectId,
    dataset: resolveDataset(env),
  };
}
