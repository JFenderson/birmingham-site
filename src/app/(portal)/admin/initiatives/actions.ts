"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireChapterAdmin } from "@/lib/auth/authorization";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import {
  approvePendingImportedInitiatives,
  moveLegacyInitiativeImportToRoot,
  reviewInitiativeSubmission,
} from "@/lib/initiatives/review";

const reviewSchema = z.object({
  submissionId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(500).optional(),
});

export async function reviewInitiative(formData: FormData) {
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const actor = await requireChapterAdmin();
  const result = await reviewInitiativeSubmission({
    chapterId: actor.chapterId!,
    reviewerId: actor.user.id,
    submissionId: parsed.data.submissionId,
    status: parsed.data.status,
    ...(parsed.data.note ? { note: parsed.data.note } : {}),
  });
  if (!result.error) {
    revalidatePath("/admin/initiatives");
    revalidatePath("/initiatives");
  }
}

export async function approveImportedInitiatives() {
  const actor = await requireChapterAdmin();
  const result = await approvePendingImportedInitiatives({
    chapterId: actor.chapterId!,
    reviewerId: actor.user.id,
  });
  if (!result.error) {
    revalidatePath("/admin/initiatives");
    revalidatePath("/initiatives");
  }
}

export async function restoreLegacyImportedInitiatives() {
  const actor = await requireChapterAdmin();
  const tenant = await getTenantContext();
  if (tenant.chapterSlug !== "root") return;

  const result = await moveLegacyInitiativeImportToRoot({
    rootChapterId: tenant.chapterId,
    reviewerId: actor.user.id,
  });
  if (!result.error) {
    revalidatePath("/admin/initiatives");
    revalidatePath("/initiatives");
  }
}
