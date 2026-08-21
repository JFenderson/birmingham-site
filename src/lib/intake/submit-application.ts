import { sendInterestFormNotifications } from "../email/send-intake-notification.ts";
import { createAdminClient } from "../supabase/admin.ts";
import {
  getInterestFormTypeLabel,
  type IntakeFormInput,
} from "../validation/schemas.ts";

export const submitApplicationDependencies = {
  createAdminClient,
  sendInterestFormNotifications,
};

export function buildProspectiveMemberInsert(
  chapterId: string,
  data: IntakeFormInput,
) {
  return {
    chapter_id: chapterId,
    full_name: data.fullName,
    email: data.email,
    phone: data.phone || null,
    form_type: data.formType,
    submitted_payload: data,
  };
}

/**
 * Inserts a validated interest/reactivation/transfer submission using the
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
  const admin = submitApplicationDependencies.createAdminClient();
  const formTypeLabel = getInterestFormTypeLabel(data.formType);
  const { error } = await admin
    .from("prospective_members")
    .insert(buildProspectiveMemberInsert(chapterId, data));

  if (!error) {
    let chapterName = "";

    try {
      const { data: chapter } = await admin
        .from("chapters")
        .select("name")
        .eq("id", chapterId)
        .maybeSingle();

      chapterName = chapter?.name ?? "";
    } catch (err) {
      console.error(
        `[email] Chapter lookup failed before intake notification send. chapterId=${chapterId}`,
        err
      );
    }

    // Best-effort confirmation email — a send failure must never fail the
    // application submission itself, which has already succeeded above.
    try {
      const notificationResult = await submitApplicationDependencies.sendInterestFormNotifications({
        to: data.email,
        applicantName: data.fullName,
        applicantEmail: data.email,
        chapterName,
        formTypeLabel,
      });

      if (notificationResult.applicantError) {
        console.error(
          `[email] Applicant receipt failed. chapterId=${chapterId} error=${notificationResult.applicantError.message}`,
        );
      }

      if (notificationResult.adminError) {
        console.error(
          `[email] Admin notification failed. chapterId=${chapterId} error=${notificationResult.adminError.message}`,
        );
      }
    } catch (err) {
      // Email is best-effort — the application itself already succeeded.
      console.error(
        `[email] Intake confirmation failed. chapterId=${chapterId} email=${data.email}`,
        err
      );
    }
  }

  return { error: error ? "Something went wrong submitting your form." : null };
}
