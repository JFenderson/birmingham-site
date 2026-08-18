import { ForgotPasswordForm } from "../forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-navy">Forgot Password?</h1>
        <p className="text-sm text-zinc-600">Enter your member account email and we’ll send a reset link.</p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
