import { event } from "./event.ts";
import { foundationBoardMember } from "./foundation-board-member.ts";
import { foundationEvent } from "./foundation-event.ts";
import { foundationProject } from "./foundation-project.ts";
import { foundationSettings } from "./foundation-settings.ts";
import { gallery } from "./gallery.ts";
import { leader } from "./leader.ts";
import { pastPresident } from "./past-president.ts";
import { post } from "./post.ts";
import { program } from "./program.ts";
import { sigmaBetaEvent } from "./sigma-beta-event.ts";
import { sigmaBetaSettings } from "./sigma-beta-settings.ts";
import { siteSettings } from "./site-settings.ts";
import { video } from "./video.ts";
import { communityInitiative } from "./community-initiative.ts";
import { signatureWeekend } from "./signature-weekend.ts";

export const sanitySchemaTypes = [
  post,
  event,
  program,
  leader,
  gallery,
  video,
  siteSettings,
  pastPresident,
  sigmaBetaSettings,
  sigmaBetaEvent,
  foundationSettings,
  foundationProject,
  foundationEvent,
  foundationBoardMember,
  communityInitiative,
  signatureWeekend,
];
