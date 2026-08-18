"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setPending(true);
    setError(null);

    const supabase = createClient();
    const refreshed = await supabase.auth.refreshSession();
    let sessionData = refreshed.data;
    if (sessionData.session) {
      await supabase.auth.setSession(sessionData.session);
    }

    let updateError = sessionData.session
      ? (await supabase.auth.updateUser({ password })).error
      : new Error("No authenticated recovery session");

    if (updateError && "status" in updateError && updateError.status === 401) {
      const refreshed = await supabase.auth.refreshSession();
      if (refreshed.data.session) {
        await supabase.auth.setSession(refreshed.data.session);
        updateError = (await supabase.auth.updateUser({ password })).error;
      }
    }

    setPending(false);
    if (updateError) {
      setError("Could not set your password. Please try again.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          New Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-navy px-4 py-2 font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
      >
        {pending ? "Saving…" : "Set Password and Continue"}
      </button>
    </form>
  );
}
