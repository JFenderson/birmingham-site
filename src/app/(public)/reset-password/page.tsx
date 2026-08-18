"use client";

import { SetPasswordForm } from "../accept-invite/set-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-navy">Reset Your Password</h1>
        <SetPasswordForm />
      </div>
    </div>
  );
}
