import { createAdminClient } from "@/lib/supabase/admin";

/* eslint-disable @typescript-eslint/no-explicit-any -- the generated Supabase types do not yet include the tracker review columns. */

const LEGACY_IMPORT_BATCH_ID = "e64fc693-f1f9-4bf5-aaa7-25f1229896b3";
const ROOT_CHAPTER_SLUG = "root";
const LEGACY_IMPORT_CHAPTER_SLUG = "miles";

export type InitiativeReviewStatus = "approved" | "rejected";

export type PendingInitiativeSubmission = {
  id: string;
  initiative: string;
  first_name: string;
  last_name: string;
  business_name: string | null;
  amount_cents: number | null;
  steps: number | null;
  tracked_on: string | null;
  spent_on: string | null;
  evidence_path: string | null;
  evidence_content_type: string | null;
  submission_source: string;
  created_at: string;
};

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

/** Returns the number of records in the one legacy batch that targeted Miles by mistake. */
export async function countLegacyInitiativeImportInMiles(): Promise<number> {
  const admin = createAdminClient();
  const { data: milesChapter } = await (admin as any)
    .from("chapters")
    .select("id")
    .eq("slug", LEGACY_IMPORT_CHAPTER_SLUG)
    .maybeSingle();

  if (!milesChapter) return 0;

  const { count } = await (admin as any)
    .from("initiative_submissions")
    .select("id", { count: "exact", head: true })
    .eq("chapter_id", milesChapter.id)
    .eq("submission_source", "group_chat_import")
    .eq("import_batch_id", LEGACY_IMPORT_BATCH_ID)
    .eq("is_deleted", false);

  return count ?? 0;
}

/**
 * Moves the one known legacy import into the Birmingham root chapter. This is
 * deliberately unavailable to any tenant other than root and records every
 * moved entry in the audit log.
 */
export async function moveLegacyInitiativeImportToRoot(input: {
  rootChapterId: string;
  reviewerId: string;
}): Promise<{ movedCount: number; error: string | null }> {
  const admin = createAdminClient();
  const { data: rootChapter } = await (admin as any)
    .from("chapters")
    .select("id")
    .eq("slug", ROOT_CHAPTER_SLUG)
    .maybeSingle();

  if (!rootChapter || rootChapter.id !== input.rootChapterId) {
    return { movedCount: 0, error: "This import can only be restored from the root chapter." };
  }

  const { data: milesChapter } = await (admin as any)
    .from("chapters")
    .select("id")
    .eq("slug", LEGACY_IMPORT_CHAPTER_SLUG)
    .maybeSingle();

  if (!milesChapter) return { movedCount: 0, error: "The legacy import source could not be found." };

  const { data, error } = await (admin as any)
    .from("initiative_submissions")
    .update({ chapter_id: input.rootChapterId })
    .eq("chapter_id", milesChapter.id)
    .eq("submission_source", "group_chat_import")
    .eq("import_batch_id", LEGACY_IMPORT_BATCH_ID)
    .eq("is_deleted", false)
    .select("id");

  if (error) return { movedCount: 0, error: "The imported entries could not be moved." };

  const moved = (data ?? []) as Array<{ id: string }>;
  await Promise.all(
    moved.map((entry) =>
      (admin as any).rpc("log_service_audit_event", {
        p_chapter_id: input.rootChapterId,
        p_user_id: input.reviewerId,
        p_action: "initiative_submissions.moved_to_root",
        p_target_table: "initiative_submissions",
        p_target_id: entry.id,
        p_metadata: {
          from_chapter: LEGACY_IMPORT_CHAPTER_SLUG,
          import_batch_id: LEGACY_IMPORT_BATCH_ID,
        },
      })
    )
  );

  return { movedCount: moved.length, error: null };
}

export async function listPendingInitiativeSubmissions(
  chapterId: string
): Promise<PendingInitiativeSubmission[]> {
  const { data } = await (createAdminClient() as any)
    .from("initiative_submissions")
    .select("id, initiative, first_name, last_name, business_name, amount_cents, steps, tracked_on, spent_on, evidence_path, evidence_content_type, submission_source, created_at")
    .eq("chapter_id", chapterId)
    .eq("review_status", "pending")
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });
  return (data ?? []) as PendingInitiativeSubmission[];
}
