"use client";

import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import {
  requestMemberAccessFormAction,
  type RequestAccessResult,
} from "./actions";

const initialState: RequestAccessResult = {
  success: true,
  message: "",
};

export function RequestAccessForm() {
  const [state, formAction, pending] = useActionState(
    requestMemberAccessFormAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="membershipNumber" className="text-sm font-semibold">
            Membership number
          </label>
          <input
            id="membershipNumber"
            name="membershipNumber"
            autoComplete="off"
            required
            maxLength={64}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition-colors focus:border-[#0047AB] focus:ring-2 focus:ring-[#0047AB]/15"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="lastName" className="text-sm font-semibold">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            required
            maxLength={120}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition-colors focus:border-[#0047AB] focus:ring-2 focus:ring-[#0047AB]/15"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-semibold">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          autoComplete="name"
          required
          maxLength={200}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition-colors focus:border-[#0047AB] focus:ring-2 focus:ring-[#0047AB]/15"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-semibold">
          Preferred email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition-colors focus:border-[#0047AB] focus:ring-2 focus:ring-[#0047AB]/15"
        />
      </div>

      {(state.success && state.message) || !state.success ? (
        <p
          aria-live="polite"
          className={`rounded-md px-4 py-3 text-sm ${
            state.success
              ? "bg-blue-50 text-[#013594]"
              : "bg-red-50 text-red-700"
          }`}
        >
          {state.success ? state.message : state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#0047AB] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#003b8e] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <ShieldCheck aria-hidden="true" className="h-4 w-4" />
        {pending ? "Submitting request..." : "Request member access"}
      </button>
    </form>
  );
}
