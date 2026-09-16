"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireChapterAdmin } from "@/lib/auth/authorization";
import { reviewInitiativeSubmission } from "@/lib/initiatives/review";

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
  if (!result.error) revalidatePath("/admin/initiatives");
}
