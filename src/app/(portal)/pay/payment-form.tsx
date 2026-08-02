"use client";

import { useEffect, useRef, useState } from "react";
import { submitPayment } from "./actions";

declare global {
  interface Window {
    Square?: {
      payments: (
        appId: string,
        locationId: string
      ) => Promise<{
        card: () => Promise<{
          attach: (selector: string) => Promise<void>;
          tokenize: () => Promise<{ status: string; token?: string }>;
        }>;
      }>;
    };
  }
}

export function PaymentForm() {
  const cardRef = useRef<Awaited<
    ReturnType<Awaited<ReturnType<NonNullable<Window["Square"]>["payments"]>>["card"]>
  > | null>(null);
  const [ready, setReady] = useState(false);
  const [amount, setAmount] = useState("20.00");
  const [type, setType] = useState<"dues" | "event_fee" | "donation">("dues");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(() => {
      if (window.Square && !cancelled) {
        clearInterval(interval);
        void (async () => {
          const payments = await window.Square!.payments(
            process.env.NEXT_PUBLIC_SQUARE_APP_ID!,
            process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!
          );
          const card = await payments.card();
          await card.attach("#card-container");
          cardRef.current = card;
          setReady(true);
        })();
      }
    }, 100);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cardRef.current) return;
    setPending(true);
    setError(null);

    const result = await cardRef.current.tokenize();
    if (result.status !== "OK" || !result.token) {
      setPending(false);
      setError("Card details invalid.");
      return;
    }

    const amountCents = Math.round(parseFloat(amount) * 100);
    const outcome = await submitPayment({
      sourceId: result.token,
      amountCents,
      type,
    });
    setPending(false);
    if (outcome.error) {
      setError(outcome.error);
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <p className="rounded-md border border-zinc-200 p-4 text-sm dark:border-zinc-800">
        Payment received — thank you.
      </p>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="dues">Dues</option>
          <option value="event_fee">Event Fee</option>
          <option value="donation">Donation</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Amount (USD)</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div id="card-container" className="rounded-md border border-zinc-300 p-3 dark:border-zinc-700" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!ready || pending}
        className="w-full rounded-md bg-navy px-4 py-2 font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
      >
        {pending ? "Processing…" : "Pay"}
      </button>
    </form>
  );
}
