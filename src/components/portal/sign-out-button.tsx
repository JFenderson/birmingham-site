"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  async function signOut() {
    setPending(true);
    setError(false);
    try {
      const { error: signOutError } = await createClient().auth.signOut({ scope: "local" });
      if (signOutError) { setError(true); return; }
      router.replace("/login");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  return <div>
    <button type="button" onClick={() => void signOut()} disabled={pending} className="min-h-11 rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">{pending ? "Signing out…" : "Sign out"}</button>
    {error && <p role="alert" className="text-xs text-red-600">Could not sign out. Please try again.</p>}
  </div>;
}
