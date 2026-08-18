"use client";

import { useState } from "react";
import { inviteMember } from "../../members/invite/actions";

export function InviteButton({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  const [state, setState] = useState<{ pending: boolean; error: string | null; sent: boolean }>({
    pending: false,
    error: null,
    sent: false,
  });

  async function handleInvite() {
    setState({ pending: true, error: null, sent: false });
    const result = await inviteMember({ fullName, email });
    if (result.error) {
      setState({ pending: false, error: result.error, sent: false });
      return;
    }
    setState({ pending: false, error: null, sent: true });
  }

  if (state.sent) {
    return (
      <p className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
        Invite sent to {email}.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => void handleInvite()}
        disabled={state.pending}
        className="min-h-11 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
      >
        {state.pending ? "Sending…" : "Invite to Portal"}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
