"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SetPasswordForm } from "../accept-invite/set-password-form";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const code = new URLSearchParams(window.location.search).get("code");
    const sessionPromise = code
      ? supabase.auth.exchangeCodeForSession(code)
      : supabase.auth.getSession();

    void sessionPromise.then(({ data }) => {
      setReady(Boolean(data.session));
      if (code) window.history.replaceState({}, "", "/reset-password");
    });
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-navy">Reset Your Password</h1>
        {ready ? <SetPasswordForm /> : <p className="text-sm text-zinc-600">Preparing your secure reset session…</p>}
      </div>
    </div>
  );
}
