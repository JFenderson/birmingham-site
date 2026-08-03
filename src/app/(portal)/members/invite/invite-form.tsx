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
      <p className="rounded-md border border-zinc-200 p-4 text-sm dark:border-zinc-800">
        Invite sent. They&apos;ll receive an email with a link to set their password.
      </p>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="fullName" className="text-sm font-medium">
          Full Name
        </label>
        <input
          id="fullName"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          {...register("fullName")}
        />
        {errors.fullName && (
          <p className="text-sm text-red-600">{errors.fullName.message}</p>
        )}
      </div>

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

      {result.error && <p className="text-sm text-red-600">{result.error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-navy px-4 py-2 font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
      >
        {isSubmitting ? "Sending…" : "Send Invite"}
      </button>
    </form>
  );
}
