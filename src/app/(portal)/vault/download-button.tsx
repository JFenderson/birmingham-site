"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function DownloadButton({
  bucket,
  path,
}: {
  bucket: string;
  path: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { data, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60);
    setPending(false);

    if (signError || !data) {
      setError("Could not generate download link.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={pending}
        className="rounded-md border border-navy px-3 py-1.5 text-sm font-medium text-navy transition-colors hover:bg-navy hover:text-white disabled:opacity-50"
      >
        {pending ? "Preparing…" : "Download"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
