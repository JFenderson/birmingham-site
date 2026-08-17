import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { event } from "./src/sanity/schema/event";
import { leader } from "./src/sanity/schema/leader";
import { post } from "./src/sanity/schema/post";
import { program } from "./src/sanity/schema/program";

export default defineConfig({
  name: "tau-sigma-cms",
  title: "Tau Sigma CMS",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? process.env.SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  plugins: [structureTool(), visionTool()],
  schema: { types: [post, event, program, leader] },
  basePath: "/studio",
});
