"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SetPasswordForm } from "../accept-invite/set-password-form";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const code = new URLSearchParams(window.location.search).get("code");
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    const sessionPromise = code
      ? supabase.auth.exchangeCodeForSession(code)
      : accessToken && refreshToken
        ? supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        : supabase.auth.getSession();

    void sessionPromise.then(({ data }) => {
      setReady(Boolean(data.session));
      if (code || accessToken) window.history.replaceState({}, "", "/reset-password");
    });
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-navy">Reset Your Password</h1>
        {ready ? <SetPasswordForm /> : <p className="text-sm text-zinc-600">This reset link is invalid or expired. Request a new password reset email.</p>}
      </div>
    </div>
  );
}
