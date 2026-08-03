import { NextResponse, type NextRequest } from "next/server";
import { sendMeetingReminders } from "@/lib/events/send-meeting-reminders";

// Vercel Cron sends `Authorization: Bearer $CRON_SECRET` on every
// invocation. This route selects events starting 23-25 hours out — with
// the daily schedule below, each qualifying event's reminder fires
// exactly once. If the schedule changes, this window must move with it.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendMeetingReminders();
  return NextResponse.json(result);
}
