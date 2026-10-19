"use client";

import { useState } from "react";

function trustedZeffyUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "zeffy.com" || url.hostname.endsWith(".zeffy.com")) ? url.toString() : null;
  } catch { return null; }
}

export function ZeffyDonationEmbed({ url, embedUrl }: { url: string | null; embedUrl: string | null }) {
  const safeUrl = trustedZeffyUrl(url);
  const safeEmbed = trustedZeffyUrl(embedUrl);
  const [failed, setFailed] = useState(false);
  if (!safeUrl) return <p className="text-sm text-slate-600">Online giving will be available when the campaign donation link is configured.</p>;
  return (
    <div className="space-y-4">
      {safeEmbed && !failed ? (
        <iframe title="Zeffy Shoes for Kids donation form" src={safeEmbed} loading="lazy"
          onError={() => setFailed(true)} className="h-[650px] w-full rounded-2xl border border-slate-200 bg-white" />
      ) : null}
      <a href={safeUrl} target="_blank" rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center rounded-full bg-[#1748A3] px-5 py-3 font-semibold text-white hover:bg-[#103777]">
        Open the secure Zeffy donation page
      </a>
      <p className="text-xs text-slate-600">Donations are completed and receipted by Zeffy. A donation counts toward campaign totals after reconciliation.</p>
    </div>
  );
}
