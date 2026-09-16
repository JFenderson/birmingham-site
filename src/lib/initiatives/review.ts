import { createAdminClient } from "@/lib/supabase/admin";

export type InitiativeReviewStatus = "approved" | "rejected";

export async function reviewInitiativeSubmission(input: {
  chapterId: string;
  reviewerId: string;
  submissionId: string;
  status: InitiativeReviewStatus;
  note?: string | undefined;
}): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("initiative_submissions")
    .update({
      review_status: input.status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: input.reviewerId,
      review_note: input.note?.trim() || null,
    })
    .eq("id", input.submissionId)
    .eq("chapter_id", input.chapterId)
    .eq("review_status", "pending")
    .select("id")
    .maybeSingle();
  if (error || !data) return { error: "That submission is no longer awaiting review." };
  await (admin as any).rpc("log_service_audit_event", {
    p_chapter_id: input.chapterId,
    p_user_id: input.reviewerId,
    p_action: `initiative_submissions.${input.status}`,
    p_target_table: "initiative_submissions",
    p_target_id: input.submissionId,
    p_metadata: {},
  });
  return { error: null };
}

export async function listPendingInitiativeSubmissions(chapterId: string) {
  const { data } = await (createAdminClient() as any)
    .from("initiative_submissions")
    .select("id, initiative, first_name, last_name, business_name, amount_cents, steps, tracked_on, spent_on, evidence_path, evidence_content_type, created_at")
    .eq("chapter_id", chapterId)
    .eq("review_status", "pending")
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });
  return data ?? [];
}
