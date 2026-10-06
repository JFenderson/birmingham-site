import { createAdminClient } from "@/lib/supabase/admin";
import type { SigmaBetaInterestInput } from "@/lib/validation/schemas";

export async function storeSigmaBetaInterest(
  chapterId: string,
  interest: SigmaBetaInterestInput,
): Promise<void> {
  const { error } = await createAdminClient()
    .from("sigma_beta_interest_submissions" as never)
    .insert({
      chapter_id: chapterId,
      parent_name: interest.parentName,
      parent_email: interest.parentEmail,
      parent_phone: interest.parentPhone,
      student_name: interest.studentName,
      student_age: interest.studentAge,
      grade_level: Number(interest.gradeLevel),
      student_school: interest.studentSchool,
      referral_source: interest.referralSource || null,
      questions: interest.message || null,
    } as never);

  if (error) throw error;
}
