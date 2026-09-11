"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(localStorage.getItem("tau-sigma-cookie-consent") !== "accepted");
  }, []);
  if (!visible) return null;
  const accept = () => {
    localStorage.setItem("tau-sigma-cookie-consent", "accepted");
    setVisible(false);
  };
  return (
    <aside
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-50 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl sm:inset-x-auto sm:right-6 sm:max-w-md"
    >
      <p className="text-sm leading-6 text-slate-700">
        We use essential cookies to keep the site secure and optional analytics
        to understand site use.{" "}
        <Link
          href="/privacy"
          className="font-semibold text-[var(--public-blue-deep)] underline"
        >
          Learn more
        </Link>
        .
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={accept}
          className="rounded-full bg-[var(--public-blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--public-blue-deep)]"
        >
          Accept
        </button>
        <button
          onClick={() => setVisible(false)}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Continue without analytics
        </button>
      </div>
    </aside>
  );
}
