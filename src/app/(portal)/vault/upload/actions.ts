"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/rbac";
import { recordDocument, softDeleteDocumentRow } from "@/lib/vault/record-document";
import { documentUploadSchema } from "@/lib/validation/schemas";

// Mirrors the Storage bucket write-role asymmetry from
// 00000000000011_storage_buckets.sql — Admin can write all three,
// Secretary can't write financials, Treasurer can't write minutes.
const CATEGORY_ROLES = {
  bylaws: ["Admin", "Secretary", "Treasurer"],
  financials: ["Treasurer", "Admin"],
  minutes: ["Secretary", "Admin"],
} as const;

export async function finalizeUpload(
  input: Record<string, unknown>
): Promise<{ error: string | null }> {
  const parsed = documentUploadSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }
  const data = parsed.data;

  const { supabase, chapterId, user, role } = await requireRole([
    "Admin",
    "Secretary",
    "Treasurer",
  ]);

  const allowedRoles: readonly string[] = CATEGORY_ROLES[data.category];
  if (!allowedRoles.includes(role)) {
    return { error: `Your role can't upload to ${data.category}.` };
  }

  // Validate storagePath is under caller's own chapter folder with no traversal.
  // The Storage bucket's RLS policy enforces this for the actual file upload,
  // but documents_officer_insert RLS policy does not re-check the path against
  // chapter_id, so we must verify it here to prevent metadata IDOR.
  const expectedPrefix = `${chapterId}/`;
  const remainder = data.storagePath.slice(expectedPrefix.length);
  if (
    !data.storagePath.startsWith(expectedPrefix) ||
    data.storagePath.includes("..") ||
    remainder.length === 0 ||
    remainder.includes("/")
  ) {
    return { error: "Invalid storage path." };
  }

  const result = await recordDocument({
    supabase,
    chapterId,
    uploadedBy: user.id,
    category: data.category,
    title: data.title,
    storagePath: data.storagePath,
  });

  if (!result.error) revalidatePath("/vault");
  return { error: result.error };
}

export async function softDeleteDocument(
  documentId: string
): Promise<{ error: string | null }> {
  const { supabase, chapterId, role } = await requireRole([
    "Admin",
    "Secretary",
    "Treasurer",
  ]);

  const { data: doc } = await supabase
    .from("documents")
    .select("id, category")
    .eq("id", documentId)
    .eq("chapter_id", chapterId)
    .maybeSingle();
  if (!doc) return { error: "Document not found." };

  const allowedRoles: readonly string[] =
    CATEGORY_ROLES[doc.category as keyof typeof CATEGORY_ROLES] ?? [];
  if (!allowedRoles.includes(role)) {
    return { error: `Your role can't remove ${doc.category} documents.` };
  }

  const { error } = await softDeleteDocumentRow({ documentId, chapterId });

  if (error) return { error };
  revalidatePath("/vault");
  return { error: null };
}
