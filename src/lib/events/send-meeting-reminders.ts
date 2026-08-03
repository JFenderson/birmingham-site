import { createAdminClient } from "@/lib/supabase/admin";
import { sendMeetingReminderEmail } from "@/lib/email/send-meeting-reminder";

export async function sendMeetingReminders(): Promise<{ sent: number; errors: number }> {
  const admin = createAdminClient();
  const windowStart = new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

  const { data: events } = await admin
    .from("events")
    .select("id, chapter_id, title, starts_at, location_name")
    .eq("is_deleted", false)
    .gte("starts_at", windowStart)
    .lte("starts_at", windowEnd);

  let sent = 0;
  let errors = 0;

  for (const event of events ?? []) {
    const { data: members } = await admin
      .from("chapter_members")
      .select("profile_id")
      .eq("chapter_id", event.chapter_id)
      .eq("is_deleted", false)
      .eq("status", "active");

    for (const member of members ?? []) {
      try {
        const [{ data: profile }, { data: userData }] = await Promise.all([
          admin.from("profiles").select("full_name").eq("id", member.profile_id).maybeSingle(),
          admin.auth.admin.getUserById(member.profile_id),
        ]);
        const email = userData.user?.email;
        if (!email) continue;
        await sendMeetingReminderEmail({
          to: email,
          recipientName: profile?.full_name ?? "there",
          eventTitle: event.title,
          startsAt: event.starts_at,
          locationName: event.location_name,
        });
        sent++;
      } catch {
        errors++;
      }
    }
  }

  return { sent, errors };
}
