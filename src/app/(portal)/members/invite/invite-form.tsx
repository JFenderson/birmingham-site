"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteMemberSchema, type InviteMemberInput } from "@/lib/validation/schemas";
import { inviteMember } from "./actions";

export function InviteForm() {
  const [result, setResult] = useState<{ error: string | null; sent: boolean }>({
    error: null,
    sent: false,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteMemberInput>({ resolver: zodResolver(inviteMemberSchema) });

  async function onSubmit(values: InviteMemberInput) {
    setResult({ error: null, sent: false });
    const outcome = await inviteMember(values);
    if (outcome.error) {
      setResult({ error: outcome.error, sent: false });
      return;
    }
    setResult({ error: null, sent: true });
    reset();
  }

  if (result.sent) {
    return (
      <p className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/90 p-5 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
        Invite sent. They&apos;ll receive an email with a link to set their password.
      </p>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-medium">
          Full Name
        </label>
        <input
          id="fullName"
          className="min-h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
          {...register("fullName")}
        />
        {errors.fullName && (
          <p className="text-sm text-red-600">{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="membershipNumber" className="text-sm font-medium">
          Membership Number (optional)
        </label>
        <input
          id="membershipNumber"
          className="min-h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
          {...register("membershipNumber")}
        />
        {errors.membershipNumber && (
          <p className="text-sm text-red-600">{errors.membershipNumber.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="min-h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {result.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
          {result.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-12 w-full rounded-full bg-navy px-4 py-3 font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
      >
        {isSubmitting ? "Sending…" : "Send Invite"}
      </button>
    </form>
  );
}
