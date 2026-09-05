"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { resolveSafeLoginRedirect } from "@/lib/security/redirects";
import { loginSchema, type LoginInput } from "@/lib/validation/schemas";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const inviteExpired = searchParams.get("error") === "invite-expired";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword(
      values
    );

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace(resolveSafeLoginRedirect(searchParams.get("redirect")));
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      className="w-full max-w-sm space-y-4"
    >
      <h1 className="text-2xl font-bold text-navy">Brothers Only Sign In</h1>

      {inviteExpired && (
        <p className="text-sm text-red-600">
          That invite link has expired. Ask an officer to resend your invite.
        </p>
      )}

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-navy px-4 py-2 font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-zinc-600">
        <Link href="/initiatives" className="font-semibold text-[var(--public-blue)] hover:underline">
          Initiative Tracker
        </Link>
        <span className="mx-2 text-zinc-400">·</span>
        Need member access?{" "}
        <Link href="/request-access" className="font-semibold text-[var(--public-blue)] hover:underline">
          Request access
        </Link>
        <span className="mx-2 text-zinc-400">·</span>
        <Link href="/login/forgot-password" className="font-semibold text-[var(--public-blue)] hover:underline">
          Forgot password?
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-4xl items-stretch gap-6 lg:grid-cols-[1fr_1.15fr]">
        <aside className="order-first flex flex-col justify-center rounded-3xl bg-[#0047AB] p-8 text-white shadow-lg lg:order-none lg:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Chapter initiatives</p>
          <h2 className="mt-3 text-3xl font-bold">Track the impact.</h2>
          <p className="mt-4 leading-7 text-blue-50">Submit Black Spending receipts or daily step screenshots without creating an account. View the chapter totals and rankings.</p>
          <Link href="/initiatives" className="mt-7 inline-flex w-fit rounded-full bg-white px-5 py-3 font-semibold text-[#0047AB] transition-colors hover:bg-blue-50">Open Initiative Tracker <span aria-hidden="true" className="ml-2">→</span></Link>
        </aside>
        <div className="flex items-center justify-center rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
        </div>
    </div>
    </div>
  );
}
