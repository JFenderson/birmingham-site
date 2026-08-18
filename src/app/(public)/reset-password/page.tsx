"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SetPasswordForm } from "../accept-invite/set-password-form";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void createClient().auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
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
