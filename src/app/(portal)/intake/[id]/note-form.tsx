"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addNote } from "../actions";

export function NoteForm({ prospectiveMemberId }: { prospectiveMemberId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setPending(true);
    setError(null);
    const result = await addNote(prospectiveMemberId, { note });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setNote("");
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-2">
      <textarea
        rows={3}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add an internal note…"
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !note.trim()}
          className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
        >
          {pending ? "Saving…" : "Add Note"}
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
