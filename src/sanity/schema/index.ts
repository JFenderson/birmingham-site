import { event } from "./event.ts";
import { gallery } from "./gallery.ts";
import { leader } from "./leader.ts";
import { pastPresident } from "./past-president.ts";
import { post } from "./post.ts";
import { program } from "./program.ts";
import { siteSettings } from "./site-settings.ts";
import { video } from "./video.ts";

export const sanitySchemaTypes = [
  post,
  event,
  program,
  leader,
  gallery,
  video,
  siteSettings,
  pastPresident,
];
