"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type {
  MemberAccessRole,
  MembershipStatus,
} from "@/lib/auth/authorization";
import {
  approveMember,
  assignMemberRole,
  restoreMember,
  suspendMember,
  type MemberActionResult,
} from "./actions";

const roleLabels: Record<MemberAccessRole, string> = {
  member: "Member",
  chapter_admin: "Chapter administrator",
  super_admin: "Super administrator",
};

type MemberAction = (
  input: Record<string, unknown>,
) => Promise<MemberActionResult>;

interface MemberActionsProps {
  memberId: string;
  memberName: string;
  status: MembershipStatus;
  role: MemberAccessRole;
  viewerRole: Extract<MemberAccessRole, "chapter_admin" | "super_admin">;
  isSelf: boolean;
  canManage: boolean;
}

export function MemberActions({
  memberId,
  memberName,
  status,
  role,
  viewerRole,
  isSelf,
  canManage,
}: MemberActionsProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<MemberAccessRole>(role);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [result, setResult] = useState<MemberActionResult>({
    error: null,
    message: null,
  });
  const feedbackId = `member-feedback-${memberId}`;

  async function runAction(
    actionName: string,
    action: MemberAction,
    input: Record<string, unknown>,
  ) {
    setPendingAction(actionName);
    setResult({ error: null, message: null });

    try {
      const outcome = await action(input);
      setResult(outcome);
      if (!outcome.error) {
        router.refresh();
      }
    } catch {
      setResult({
        error: "The member update could not be completed. Try again.",
        message: null,
      });
    } finally {
      setPendingAction(null);
    }
  }

  function submitStatusChange(
    event: React.FormEvent<HTMLFormElement>,
    actionName: string,
    action: MemberAction,
    nextStatus: MembershipStatus,
  ) {
    event.preventDefault();
    void runAction(actionName, action, { memberId, status: nextStatus });
  }

  function submitRoleChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runAction("role", assignMemberRole, {
      memberId,
      role: selectedRole,
    });
  }

  if (!canManage) {
    return (
      <p className="text-xs text-zinc-500">
        Only a super administrator can manage this account.
      </p>
    );
  }

  if (isSelf) {
    return (
      <p className="text-xs text-zinc-500">
        Use another administrator account to change your own access.
      </p>
    );
  }

  const roleOptions: readonly MemberAccessRole[] =
    viewerRole === "super_admin"
      ? ["member", "chapter_admin", "super_admin"]
      : ["member", "chapter_admin"];

  return (
    <div className="min-w-56 space-y-3">
      <div className="flex flex-wrap gap-2">
        {status === "pending" && (
          <form
            onSubmit={(event) =>
              submitStatusChange(event, "approve", approveMember, "approved")
            }
          >
            <button
              type="submit"
              aria-describedby={feedbackId}
              disabled={pendingAction !== null}
              className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
            >
              {pendingAction === "approve" ? "Approving…" : `Approve ${memberName}`}
            </button>
          </form>
        )}
        {status === "approved" && (
          <form
            onSubmit={(event) =>
              submitStatusChange(event, "suspend", suspendMember, "suspended")
            }
          >
            <button
              type="submit"
              aria-describedby={feedbackId}
              disabled={pendingAction !== null}
              className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
            >
              {pendingAction === "suspend" ? "Suspending…" : `Suspend ${memberName}`}
            </button>
          </form>
        )}
        {status === "suspended" && (
          <form
            onSubmit={(event) =>
              submitStatusChange(event, "restore", restoreMember, "approved")
            }
          >
            <button
              type="submit"
              aria-describedby={feedbackId}
              disabled={pendingAction !== null}
              className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
            >
              {pendingAction === "restore" ? "Restoring…" : `Restore ${memberName}`}
            </button>
          </form>
        )}
      </div>

      <form onSubmit={submitRoleChange} className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label
            htmlFor={`member-role-${memberId}`}
            className="block text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            Role for {memberName}
          </label>
          <select
            id={`member-role-${memberId}`}
            value={selectedRole}
            onChange={(event) =>
              setSelectedRole(event.target.value as MemberAccessRole)
            }
            disabled={pendingAction !== null}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
          >
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {roleLabels[option]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          aria-describedby={feedbackId}
          disabled={pendingAction !== null || selectedRole === role}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          {pendingAction === "role" ? "Saving…" : "Assign role"}
        </button>
      </form>

      <p
        id={feedbackId}
        aria-live="polite"
        className={result.error ? "text-xs text-red-600" : "text-xs text-green-700"}
      >
        {result.error ?? result.message}
      </p>
    </div>
  );
}
