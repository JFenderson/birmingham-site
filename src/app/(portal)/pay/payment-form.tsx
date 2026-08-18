"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard, ShieldCheck } from "lucide-react";
import { PortalLoadingState } from "@/components/portal/portal-loading-state";
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
    // Square's CDN script may fail to load (blocked, slow, or the app just
    // isn't configured with credentials). Without a bound, a missing
    // window.Square would poll forever with the Pay button silently stuck
    // disabled and no feedback. Bail out after ~5s (50 * 100ms).
    let attempts = 0;
    const MAX_ATTEMPTS = 50;
    const interval = setInterval(() => {
      if (cancelled) return;
      attempts += 1;
      if (window.Square) {
        clearInterval(interval);
        void (async () => {
          try {
            const payments = await window.Square!.payments(
              process.env.NEXT_PUBLIC_SQUARE_APP_ID!,
              process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!
            );
            const card = await payments.card();
            await card.attach("#card-container");
            if (cancelled) return;
            cardRef.current = card;
            setReady(true);
          } catch {
            if (!cancelled) {
              setError("Payments aren't available right now — please try again later.");
            }
          }
        })();
      } else if (attempts >= MAX_ATTEMPTS) {
        clearInterval(interval);
        setError("Payments aren't available right now — please try again later.");
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

    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const result = await cardRef.current.tokenize();
      if (result.status !== "OK" || !result.token) {
        setPending(false);
        setError("Card details invalid.");
        return;
      }

      const amountCents = Math.round(parsedAmount * 100);
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
    } catch {
      setPending(false);
      setError("Something went wrong — please check your payment history before trying again.");
    }
  }

  if (success) {
    return (
      <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/90 p-5 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
        Payment received — thank you.
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="min-h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="dues">Dues</option>
          <option value="event_fee">Event Fee</option>
          <option value="donation">Donation</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Amount (USD)</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          className="min-h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="space-y-3 rounded-[1.75rem] border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-navy/8 text-navy dark:bg-blue-400/10 dark:text-blue-200">
            <CreditCard className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">Card details</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Powered by the existing Square checkout embed.
            </p>
          </div>
        </div>

        {!ready && !error ? (
          <PortalLoadingState
            label="Loading payment card fields"
            blocks={1}
            className="border-none bg-transparent p-0 shadow-none"
          />
        ) : null}

        <div
          id="card-container"
          className="min-h-24 rounded-[1.5rem] border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="flex items-start gap-3 rounded-[1.5rem] border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-800 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>Use a valid payment amount and keep this page open until the charge confirms.</p>
      </div>

      <button
        type="submit"
        disabled={!ready || pending}
        className="min-h-12 w-full rounded-full bg-navy px-4 py-3 font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
      >
        {pending ? "Processing…" : "Pay"}
      </button>
    </form>
  );
}
