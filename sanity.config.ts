import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { getSanityStudioConfig } from "./src/sanity/config";
import { sanitySchemaTypes } from "./src/sanity/schema";

const studioConfig = getSanityStudioConfig();

export default defineConfig({
  name: "tau-sigma-cms",
  title: "Tau Sigma CMS",
  projectId: studioConfig.projectId,
  dataset: studioConfig.dataset,
  plugins: [structureTool(), visionTool()],
  schema: { types: sanitySchemaTypes },
  basePath: "/studio",
});
