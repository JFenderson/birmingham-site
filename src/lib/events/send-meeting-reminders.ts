import { createAdminClient } from "@/lib/supabase/admin";
import { sendMeetingReminderEmail } from "@/lib/email/send-meeting-reminder";
import { resolveRecipient } from "@/lib/email/resolve-recipient";

export async function sendMeetingReminders(): Promise<{
  sent: number;
  errors: number;
  skipped: number;
}> {
  const admin = createAdminClient();
  const windowStart = new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

  const { data: events, error: eventsError } = await admin
    .from("events")
    .select("id, chapter_id, title, starts_at, location_name")
    .eq("is_deleted", false)
    .gte("starts_at", windowStart)
    .lte("starts_at", windowEnd);

  if (eventsError) {
    console.error("[email] Meeting reminder events query failed", eventsError);
  }

  let sent = 0;
  let errors = 0;
  let skipped = 0;

  for (const event of events ?? []) {
    const { data: members, error: membersError } = await admin
      .from("chapter_members")
      .select("profile_id")
      .eq("chapter_id", event.chapter_id)
      .eq("is_deleted", false)
      .eq("status", "active");

    if (membersError) {
      console.error(
        `[email] Meeting reminder members query failed. chapterId=${event.chapter_id} eventId=${event.id}`,
        membersError
      );
    }

    for (const member of members ?? []) {
      try {
        const recipient = await resolveRecipient(admin, member.profile_id);
        if (!recipient) {
          skipped++;
          continue;
        }
        await sendMeetingReminderEmail({
          to: recipient.email,
          recipientName: recipient.name,
          eventTitle: event.title,
          startsAt: event.starts_at,
          locationName: event.location_name,
        });
        sent++;
      } catch (err) {
        errors++;
        console.error(
          `[email] Meeting reminder send failed. eventId=${event.id} chapterId=${event.chapter_id} profileId=${member.profile_id}`,
          err
        );
      }
    }
  }

  return { sent, errors, skipped };
}
