"use client";

import { useActionState } from "react";
import { requestSignInLink } from "./actions";

export function EmailLinkForm() {
  const [message, action, pending] = useActionState(requestSignInLink, "");
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-zinc-600">Enter the email address on your member account. We’ll send you a link so you don’t need to remember a password.</p>
      <label htmlFor="link-email" className="block text-sm font-medium">Email address</label>
      <input id="link-email" name="email" type="email" autoComplete="email" required maxLength={254} className="min-h-12 w-full rounded-md border border-zinc-300 px-3 py-2" />
      <button disabled={pending} className="min-h-12 w-full rounded-md bg-navy px-4 py-2 font-semibold text-white disabled:opacity-50">{pending ? "Sending…" : "Email me a sign-in link"}</button>
      <p role="status" className="text-sm text-zinc-600">{message}</p>
    </form>
  );
}
