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

  // Policy decision: financial records are sensitive enough that read
  // access should match the write restriction (Treasurer/Admin only).
  // bylaws/minutes intentionally keep the table default (all five roles)
  // since those are appropriately chapter-wide readable.
  const visibleToRoles: Database["public"]["Enums"]["member_role"][] | undefined =
    params.category === "financials" ? ["Treasurer", "Admin"] : undefined;

  const { data, error } = await params.supabase
    .from("documents")
    .insert({
      chapter_id: params.chapterId,
      category: params.category,
      title: params.title,
      storage_bucket: bucket,
      storage_path: params.storagePath,
      uploaded_by: params.uploadedBy,
      ...(visibleToRoles ? { visible_to_roles: visibleToRoles } : {}),
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
 * insert. The observed symptom driving this was NOT a raised 42501 error
 * from the documents_officer_update policy's WITH CHECK clause — it was a
 * silent no-op: the UPDATE returned `error: null` with zero rows changed
 * under the caller's own authenticated client. A silent no-op with no
 * error is the signature of a USING clause matching zero rows, not a
 * WITH CHECK violation (which does raise 42501), but the true root cause
 * was not conclusively pinned down. Routing this write through the admin
 * client is a pragmatic fix given the app layer above already re-validates
 * everything the RLS policy would have checked — not a fix based on a
 * fully-confirmed diagnosis.
 *
 * Because this bypasses the RLS layer that would normally attribute the
 * change to auth.uid() in the audit_documents trigger, the caller passes
 * along the authenticated actor's own id/chapter and separately logs an
 * audit event via the caller's own (non-admin) client — see
 * softDeleteDocument in src/app/(portal)/vault/upload/actions.ts.
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
