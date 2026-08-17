import { createClient } from "next-sanity";

const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? process.env.SANITY_PROJECT_ID;

if (!projectId) {
  throw new Error(
    "Sanity is not configured. Set NEXT_PUBLIC_SANITY_PROJECT_ID (or SANITY_PROJECT_ID for local development)."
  );
}

export const sanityClient = createClient({
  projectId,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2026-01-01",
  useCdn: process.env.NODE_ENV === "production",
});
