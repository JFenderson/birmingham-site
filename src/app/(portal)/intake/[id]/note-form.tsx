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
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3">
      <textarea
        rows={4}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add an internal note…"
        className="w-full rounded-[1.5rem] border border-zinc-300 bg-white px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending || !note.trim()}
          className="min-h-11 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
        >
          {pending ? "Saving…" : "Add Note"}
        </button>
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
      </div>
    </form>
  );
}
