"use server";

import { revalidatePath } from "next/cache";

import { requireChapterAdmin } from "@/lib/auth/authorization";
import type { MemberContext } from "@/lib/auth/member";
import {
  getRoleAssignmentError,
  getStatusChangeError,
} from "@/lib/members/member-management";
import {
  memberRoleAssignmentSchema,
  memberStatusUpdateSchema,
  type MemberRoleInput,
  type MembershipStatusInput,
} from "@/lib/validation/schemas";
import type { Database } from "@/types/database.types";

export interface MemberActionResult {
  error: string | null;
  message: string | null;
}

type ManagedMember = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "chapter_id" | "membership_status" | "role"
>;

type MemberLookupResult =
  | { member: ManagedMember; error: null }
  | { member: null; error: string };

const invalidRequest: MemberActionResult = {
  error: "The member update request was invalid.",
  message: null,
};

async function loadManagedMember(
  actor: MemberContext,
  memberId: string,
): Promise<MemberLookupResult> {
  let query = actor.supabase
    .from("profiles")
    .select("id, chapter_id, membership_status, role")
    .eq("id", memberId);

  if (actor.role !== "super_admin") {
    if (!actor.chapterId) {
      return { member: null, error: "Your administrator chapter is unavailable." };
    }
    query = query.eq("chapter_id", actor.chapterId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Unable to load a managed member:", error);
    return { member: null, error: "Could not load that member." };
  }

  if (!data) {
    return { member: null, error: "Member not found." };
  }

  if (actor.role !== "super_admin" && data.role === "super_admin") {
    return { member: null, error: "You cannot manage a super administrator." };
  }

  return { member: data, error: null };
}

async function updateMembershipStatus(
  actor: MemberContext,
  input: Record<string, unknown>,
  expectedStatus: MembershipStatusInput,
): Promise<MemberActionResult> {
  const parsed = memberStatusUpdateSchema.safeParse(input);
  if (!parsed.success || parsed.data.status !== expectedStatus) {
    return invalidRequest;
  }

  const lookup = await loadManagedMember(actor, parsed.data.memberId);
  if (!lookup.member) {
    return { error: lookup.error, message: null };
  }

  const transitionError = getStatusChangeError({
    actorId: actor.user.id,
    targetId: lookup.member.id,
    currentStatus: lookup.member.membership_status,
    nextStatus: parsed.data.status,
  });
  if (transitionError) {
    return { error: transitionError, message: null };
  }

  const update: Database["public"]["Tables"]["profiles"]["Update"] = {
    membership_status: parsed.data.status,
  };
  if (
    lookup.member.membership_status === "pending" &&
    parsed.data.status === "approved"
  ) {
    update.approved_at = new Date().toISOString();
    update.approved_by = actor.user.id;
  }

  let query = actor.supabase
    .from("profiles")
    .update(update)
    .eq("id", lookup.member.id)
    .eq("membership_status", lookup.member.membership_status);

  if (actor.role !== "super_admin" && actor.chapterId) {
    query = query.eq("chapter_id", actor.chapterId);
  }

  const { data, error } = await query.select("id").maybeSingle();
  if (error) {
    console.error("Unable to update member status:", error);
    return { error: "Could not update the member's status.", message: null };
  }
  if (!data) {
    return {
      error: "The member changed before this update completed. Refresh and try again.",
      message: null,
    };
  }

  revalidatePath("/admin/members");
  return { error: null, message: "Membership status updated." };
}

export async function approveMember(
  input: Record<string, unknown>,
): Promise<MemberActionResult> {
  const actor = await requireChapterAdmin();
  return updateMembershipStatus(actor, input, "approved");
}

export async function suspendMember(
  input: Record<string, unknown>,
): Promise<MemberActionResult> {
  const actor = await requireChapterAdmin();
  return updateMembershipStatus(actor, input, "suspended");
}

export async function restoreMember(
  input: Record<string, unknown>,
): Promise<MemberActionResult> {
  const actor = await requireChapterAdmin();
  return updateMembershipStatus(actor, input, "approved");
}

export async function assignMemberRole(
  input: Record<string, unknown>,
): Promise<MemberActionResult> {
  const actor = await requireChapterAdmin();
  const parsed = memberRoleAssignmentSchema.safeParse(input);
  if (!parsed.success) {
    return invalidRequest;
  }

  const lookup = await loadManagedMember(actor, parsed.data.memberId);
  if (!lookup.member) {
    return { error: lookup.error, message: null };
  }

  const roleError = getRoleAssignmentError({
    actorId: actor.user.id,
    actorRole: actor.role as Extract<
      MemberRoleInput,
      "chapter_admin" | "super_admin"
    >,
    targetId: lookup.member.id,
    currentRole: lookup.member.role,
    nextRole: parsed.data.role,
  });
  if (roleError) {
    return { error: roleError, message: null };
  }

  let query = actor.supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", lookup.member.id)
    .eq("role", lookup.member.role);

  if (actor.role !== "super_admin" && actor.chapterId) {
    query = query.eq("chapter_id", actor.chapterId);
  }

  const { data, error } = await query.select("id").maybeSingle();
  if (error) {
    console.error("Unable to assign member role:", error);
    return { error: "Could not update the member's role.", message: null };
  }
  if (!data) {
    return {
      error: "The member changed before this update completed. Refresh and try again.",
      message: null,
    };
  }

  revalidatePath("/admin/members");
  return { error: null, message: "Member role updated." };
}
