"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import {
  submitSigmaBetaInterestFormAction,
  type SigmaBetaInterestResult,
} from "@/app/(public)/sigma-beta-club/actions";

const initialState: SigmaBetaInterestResult = {
  success: true,
  message: "",
};

export function SigmaBetaInterestForm() {
  const [state, formAction, pending] = useActionState(
    submitSigmaBetaInterestFormAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {/* Honeypot: hidden from sighted users and assistive tech; real
          visitors never populate it. Any non-empty value is treated as a
          bot submission. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-semibold text-[var(--public-ink)]">
            Name
          </label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            required
            maxLength={200}
            className="w-full rounded-md border border-[var(--public-border)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--public-blue)] focus:ring-2 focus:ring-[var(--public-blue)]/15"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold text-[var(--public-ink)]">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            className="w-full rounded-md border border-[var(--public-border)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--public-blue)] focus:ring-2 focus:ring-[var(--public-blue)]/15"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-semibold text-[var(--public-ink)]">
            Phone (optional)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={20}
            className="w-full rounded-md border border-[var(--public-border)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--public-blue)] focus:ring-2 focus:ring-[var(--public-blue)]/15"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="role" className="text-sm font-semibold text-[var(--public-ink)]">
            I am a
          </label>
          <select
            id="role"
            name="role"
            required
            defaultValue="student"
            className="w-full rounded-md border border-[var(--public-border)] bg-[var(--public-surface)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--public-blue)] focus:ring-2 focus:ring-[var(--public-blue)]/15"
          >
            <option value="student">Student</option>
            <option value="parent_guardian">Parent/Guardian</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-semibold text-[var(--public-ink)]">
          Message (optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={2000}
          className="w-full rounded-md border border-[var(--public-border)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--public-blue)] focus:ring-2 focus:ring-[var(--public-blue)]/15"
        />
      </div>

      {(state.success && state.message) || !state.success ? (
        <p
          aria-live="polite"
          className={`rounded-md px-4 py-3 text-sm ${
            state.success
              ? "bg-[var(--public-surface-subtle)] text-[var(--public-blue-deep)]"
              : "bg-red-50 text-red-700"
          }`}
        >
          {state.success ? state.message : state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--public-blue)] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--public-blue-deep)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <Send aria-hidden="true" className="h-4 w-4" />
        {pending ? "Sending..." : "Send interest form"}
      </button>
    </form>
  );
}
