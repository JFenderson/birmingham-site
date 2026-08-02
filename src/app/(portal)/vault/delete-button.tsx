"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { softDeleteDocument } from "./upload/actions";

export function DeleteButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm("Remove this document?")) return;
    setPending(true);
    setError(null);
    try {
      const result = await softDeleteDocument(documentId);
      setPending(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setPending(false);
      setError("Something went wrong — please try again.");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={pending}
        className="text-xs text-red-600 hover:underline disabled:opacity-50"
      >
        {pending ? "Removing…" : "Remove"}
      </button>
      {error && <span className="max-w-48 text-right text-xs text-red-600">{error}</span>}
    </div>
  );
}
