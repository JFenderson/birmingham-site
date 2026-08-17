import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { event } from "./src/sanity/schema/event";
import { leader } from "./src/sanity/schema/leader";
import { post } from "./src/sanity/schema/post";
import { program } from "./src/sanity/schema/program";

// Sanity project IDs are public identifiers. Keep a local fallback so the
// embedded Studio always receives a valid browser-side configuration.
const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "bm3reaf9";

export default defineConfig({
  name: "tau-sigma-cms",
  title: "Tau Sigma CMS",
  projectId: sanityProjectId,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  plugins: [structureTool(), visionTool()],
  schema: { types: [post, event, program, leader] },
  basePath: "/studio",
});
