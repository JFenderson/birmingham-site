import { NextResponse, type NextRequest } from "next/server";
import { sendMeetingReminders } from "@/lib/events/send-meeting-reminders";

// Vercel Cron sends `Authorization: Bearer $CRON_SECRET` on every
// invocation. This route selects events starting 23-25 hours out — with
// the daily schedule below, each qualifying event's reminder fires
// exactly once. If the schedule changes, this window must move with it.
//
// The `0 14 * * *` UTC schedule (see vercel.json) lands at 9:00 AM Central
// during CDT but 8:00 AM Central during CST — the cron expression itself
// has no DST awareness. Rendering the reminder email's time with
// `timeZone: "America/Chicago"` keeps the *displayed* event time correct
// year-round, but the actual *send time* relative to local wall-clock
// still drifts by an hour across the DST boundary twice a year.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendMeetingReminders();
  return NextResponse.json(result);
}
