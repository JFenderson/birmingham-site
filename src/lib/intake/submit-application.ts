import { createAdminClient } from "@/lib/supabase/admin";
import type { IntakeFormInput } from "@/lib/validation/schemas";
import { sendIntakeReceivedEmail } from "@/lib/email/send-intake-notification";

/**
 * Inserts a validated intake/reactivation/transfer submission using the
 * service-role client — the applicant has no session, and no anon RLS
 * insert policy exists on prospective_members (by design; see
 * 00000000000009_prospective_members.sql). Kept in lib/, not src/app/**,
 * so the no-restricted-imports ESLint rule keeps the service-role client
 * out of route/page code everywhere except this narrow, reviewed path.
 */
export async function submitApplication(
  chapterId: string,
  data: IntakeFormInput
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { error } = await admin.from("prospective_members").insert({
    chapter_id: chapterId,
    full_name: data.fullName,
    email: data.email,
    phone: data.phone || null,
    form_type: data.formType,
    submitted_payload: data,
  });

  if (!error) {
    // Best-effort confirmation email — a send failure must never fail the
    // application submission itself, which has already succeeded above.
    try {
      const { data: chapter } = await admin
        .from("chapters")
        .select("name")
        .eq("id", chapterId)
        .maybeSingle();

      await sendIntakeReceivedEmail({
        to: data.email,
        applicantName: data.fullName,
        chapterName: chapter?.name ?? "",
      });
    } catch (err) {
      // Email is best-effort — the application itself already succeeded.
      console.error(
        `[email] Intake confirmation failed. chapterId=${chapterId} email=${data.email}`,
        err
      );
    }
  }

  return { error: error ? "Something went wrong submitting your application." : null };
}
