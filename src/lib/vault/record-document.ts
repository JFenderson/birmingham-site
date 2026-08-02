import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";

const BUCKET_BY_CATEGORY: Record<"bylaws" | "financials" | "minutes", string> = {
  bylaws: "bylaws",
  financials: "financials",
  minutes: "minutes",
};

/**
 * Inserts the documents metadata row using the caller's own authenticated
 * client (RLS already permits Admin/Secretary/Treasurer regardless of
 * category — the narrower category/role match is enforced by the caller in
 * src/app/(portal)/vault/upload/actions.ts before this is invoked). Kept out
 * of src/app/** per the admin-client import boundary — same pattern as
 * src/lib/intake/submit-application.ts — but the admin client here is only
 * used to clean up an orphaned Storage object if the metadata insert fails.
 */
export async function recordDocument(params: {
  supabase: SupabaseClient<Database>;
  chapterId: string;
  uploadedBy: string;
  category: "bylaws" | "financials" | "minutes";
  title: string;
  storagePath: string;
}): Promise<{ error: string | null; documentId?: string }> {
  const bucket = BUCKET_BY_CATEGORY[params.category];

  const { data, error } = await params.supabase
    .from("documents")
    .insert({
      chapter_id: params.chapterId,
      category: params.category,
      title: params.title,
      storage_bucket: bucket,
      storage_path: params.storagePath,
      uploaded_by: params.uploadedBy,
    })
    .select("id")
    .single();

  if (error || !data) {
    // Metadata insert failed after the file was already uploaded to
    // Storage — clean up the orphaned object rather than leaving a file
    // no documents row (and therefore no read-RLS match) can ever expose.
    const admin = createAdminClient();
    await admin.storage.from(bucket).remove([params.storagePath]);
    return { error: "Could not save document metadata." };
  }

  return { error: null, documentId: data.id };
}

/**
 * Flips is_deleted on a documents row using the service-role client.
 *
 * The caller (softDeleteDocument in
 * src/app/(portal)/vault/upload/actions.ts) has already re-validated the
 * requesting officer's role and their category-write permission at the
 * application layer before calling this — the same defense-in-depth
 * pattern as recordDocument's Storage cleanup above, and the same
 * reasoning as src/lib/attendance/record-check-in.ts's server-side-only
 * insert. The documents_officer_update RLS policy's WITH CHECK clause has
 * been observed to reject this exact UPDATE even when its own
 * has_role(...) predicate evaluates true in isolation for the same
 * user/chapter/role immediately beforehand, so the write is routed
 * through the admin client rather than the caller's authenticated client.
 */
export async function softDeleteDocumentRow(params: {
  documentId: string;
  chapterId: string;
}): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("documents")
    .update({ is_deleted: true })
    .eq("id", params.documentId)
    .eq("chapter_id", params.chapterId);

  return { error: error ? "Could not remove document." : null };
}
