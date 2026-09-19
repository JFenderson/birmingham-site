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

/**
 * Approves only entries that an officer imported from the chapter's group
 * tracking log. Public submissions remain in the individual review queue.
 */
export async function approvePendingImportedInitiatives(input: {
  chapterId: string;
  reviewerId: string;
}): Promise<{ approvedCount: number; error: string | null }> {
  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("initiative_submissions")
    .update({
      review_status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: input.reviewerId,
      review_note: "Approved as a chapter group-log import.",
    })
    .eq("chapter_id", input.chapterId)
    .eq("submission_source", "group_chat_import")
    .eq("review_status", "pending")
    .eq("is_deleted", false)
    .select("id");

  if (error) return { approvedCount: 0, error: "The imported entries could not be approved." };

  const approved = (data ?? []) as Array<{ id: string }>;
  await Promise.all(
    approved.map((entry) =>
      (admin as any).rpc("log_service_audit_event", {
        p_chapter_id: input.chapterId,
        p_user_id: input.reviewerId,
        p_action: "initiative_submissions.approved",
        p_target_table: "initiative_submissions",
        p_target_id: entry.id,
        p_metadata: { source: "group_chat_import", review_mode: "bulk" },
      })
    )
  );

  return { approvedCount: approved.length, error: null };
}

export async function listPendingInitiativeSubmissions(chapterId: string) {
  const { data } = await (createAdminClient() as any)
    .from("initiative_submissions")
    .select("id, initiative, first_name, last_name, business_name, amount_cents, steps, tracked_on, spent_on, evidence_path, evidence_content_type, submission_source, created_at")
    .eq("chapter_id", chapterId)
    .eq("review_status", "pending")
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });
  return data ?? [];
}
