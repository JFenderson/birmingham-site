"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateStage } from "../actions";

const STAGE_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  interview: "Interview",
  approved: "Approved",
  denied: "Denied",
  reactivation: "Reactivation",
  transfer: "Transfer",
};

export function StageForm({
  prospectiveMemberId,
  currentStage,
  options,
}: {
  prospectiveMemberId: string;
  currentStage: string;
  options: readonly string[];
}) {
  const router = useRouter();
  const [stage, setStage] = useState(currentStage);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await updateStage(prospectiveMemberId, { pipelineStage: stage });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-3 flex items-center gap-3">
      <select
        value={stage}
        onChange={(e) => setStage(e.target.value)}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {STAGE_LABELS[opt] ?? opt}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending || stage === currentStage}
        className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
      >
        {pending ? "Saving…" : "Update Stage"}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  );
}
