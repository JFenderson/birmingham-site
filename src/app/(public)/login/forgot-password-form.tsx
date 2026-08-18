"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=%2Freset-password`,
    });
    setPending(false);
    setSent(true);
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-3">
      <label htmlFor="recovery-email" className="text-sm font-medium">Email for password reset</label>
      <input id="recovery-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" />
      <button type="submit" disabled={pending} className="w-full rounded-md border border-[var(--public-blue)] px-4 py-2 font-semibold text-[var(--public-blue)] disabled:opacity-50">
        {pending ? "Sending…" : "Email reset link"}
      </button>
      {sent && <p className="text-sm text-zinc-600">If an account exists for that email, a reset link has been sent.</p>}
    </form>
  );
}
