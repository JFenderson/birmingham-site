import { createClient } from "next-sanity";
import { getSanityClientConfig } from "./config.ts";

export const sanityClient = createClient(getSanityClientConfig());
