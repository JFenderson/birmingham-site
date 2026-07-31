"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/rbac";
import { intakeStageSchema, intakeNoteSchema } from "@/lib/validation/schemas";

const INTAKE_ROLES = ["Intake Director", "Admin"] as const;

/**
 * Confirms prospectiveMemberId actually belongs to the caller's chapter
 * before any write — chapterId alone isn't enough to scope a write to a
 * *different* row's foreign key (see addNote below, which was vulnerable
 * to attaching a note to another chapter's applicant before this check
 * was added).
 */
async function assertOwnedByChapter(
  supabase: Awaited<ReturnType<typeof requireRole>>["supabase"],
  prospectiveMemberId: string,
  chapterId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("prospective_members")
    .select("id")
    .eq("id", prospectiveMemberId)
    .eq("chapter_id", chapterId)
    .maybeSingle();
  return !!data;
}

export async function updateStage(
  prospectiveMemberId: string,
  input: { pipelineStage: string }
): Promise<{ error: string | null }> {
  const { supabase, chapterId } = await requireRole(INTAKE_ROLES);

  const parsed = intakeStageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid stage." };
  }

  if (!(await assertOwnedByChapter(supabase, prospectiveMemberId, chapterId))) {
    return { error: "Application not found." };
  }

  const { error } = await supabase
    .from("prospective_members")
    .update({ pipeline_stage: parsed.data.pipelineStage })
    .eq("id", prospectiveMemberId)
    .eq("chapter_id", chapterId);

  if (error) return { error: "Could not update stage." };

  revalidatePath(`/intake/${prospectiveMemberId}`);
  revalidatePath("/intake");
  return { error: null };
}

export async function addNote(
  prospectiveMemberId: string,
  input: { note: string }
): Promise<{ error: string | null }> {
  const { supabase, user, chapterId } = await requireRole(INTAKE_ROLES);

  const parsed = intakeNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Note cannot be empty." };
  }

  if (!(await assertOwnedByChapter(supabase, prospectiveMemberId, chapterId))) {
    return { error: "Application not found." };
  }

  const { error } = await supabase.from("prospective_member_notes").insert({
    prospective_member_id: prospectiveMemberId,
    chapter_id: chapterId,
    author_id: user.id,
    note: parsed.data.note,
  });

  if (error) return { error: "Could not save note." };

  revalidatePath(`/intake/${prospectiveMemberId}`);
  return { error: null };
}
