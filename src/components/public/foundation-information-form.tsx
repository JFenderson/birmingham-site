"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import {
  submitFoundationInformationRequestFormAction,
  type FoundationInformationRequestResult,
} from "@/app/(public)/foundation/actions";

const initialState: FoundationInformationRequestResult = {
  success: true,
  message: "",
};

export function FoundationInformationForm() {
  const [state, formAction, pending] = useActionState(
    submitFoundationInformationRequestFormAction,
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
          <label htmlFor="organization" className="text-sm font-semibold text-[var(--public-ink)]">
            Organization (optional)
          </label>
          <input
            id="organization"
            name="organization"
            autoComplete="organization"
            maxLength={200}
            className="w-full rounded-md border border-[var(--public-border)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--public-blue)] focus:ring-2 focus:ring-[var(--public-blue)]/15"
          />
        </div>

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
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-semibold text-[var(--public-ink)]">
          What information are you requesting?
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
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
        {pending ? "Sending..." : "Send request"}
      </button>
    </form>
  );
}
