import type {
  MemberAccessRole,
  MembershipStatus,
} from "@/lib/auth/authorization";

const ALLOWED_STATUS_TRANSITIONS: Readonly<
  Partial<Record<MembershipStatus, readonly MembershipStatus[]>>
> = {
  pending: ["approved"],
  approved: ["suspended"],
  suspended: ["approved"],
};

export function getStatusTransitionError(
  currentStatus: MembershipStatus,
  nextStatus: MembershipStatus,
): string | null {
  if (ALLOWED_STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus)) {
    return null;
  }

  return `A member cannot move from ${currentStatus} to ${nextStatus}.`;
}

interface StatusChangePolicyInput {
  actorId: string;
  targetId: string;
  currentStatus: MembershipStatus;
  nextStatus: MembershipStatus;
}

export function getStatusChangeError({
  actorId,
  targetId,
  currentStatus,
  nextStatus,
}: StatusChangePolicyInput): string | null {
  if (actorId === targetId) {
    return "You cannot change your own membership status.";
  }

  return getStatusTransitionError(currentStatus, nextStatus);
}

interface RoleAssignmentPolicyInput {
  actorId: string;
  actorRole: Extract<MemberAccessRole, "chapter_admin" | "super_admin">;
  targetId: string;
  currentRole: MemberAccessRole;
  nextRole: MemberAccessRole;
}

export function getRoleAssignmentError({
  actorId,
  actorRole,
  targetId,
  currentRole,
  nextRole,
}: RoleAssignmentPolicyInput): string | null {
  if (currentRole === nextRole) {
    return "This member already has that role.";
  }

  if (actorId === targetId) {
    return "You cannot remove your own administrator access.";
  }

  if (actorRole !== "super_admin" && nextRole === "super_admin") {
    return "Only a super administrator can grant global access.";
  }

  return null;
}
