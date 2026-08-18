import Script from "next/script";
import { CreditCard, ShieldCheck } from "lucide-react";
import { PortalCard } from "@/components/portal/portal-card";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { PortalStatusBadge } from "@/components/portal/portal-status-badge";
import { PaymentForm } from "./payment-form";

export default function PayPage() {
  const sandboxUrl = "https://sandbox.web.squarecdn.com/v1/square.js";
  const productionUrl = "https://web.squarecdn.com/v1/square.js";
  const src =
    process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === "production" ? productionUrl : sandboxUrl;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <Script src={src} strategy="afterInteractive" />
      <PortalPageHeader
        eyebrow="Chapter Payments"
        title="Make a Payment"
        description="Submit dues, event fees, or donations through the existing Square checkout flow without leaving the member portal."
        badge={<PortalStatusBadge variant="info">Secure checkout</PortalStatusBadge>}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <PortalCard className="rounded-[2rem] p-5 sm:p-6" variant="elevated">
          <PaymentForm />
        </PortalCard>

        <PortalCard className="space-y-4 rounded-[2rem] p-5 sm:p-6" variant="subtle">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-navy/8 text-navy dark:bg-blue-400/10 dark:text-blue-200">
              <CreditCard className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Payment types
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Dues, event fees, and chapter donations.
              </p>
            </div>
          </div>

          <ul className="space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            <li className="rounded-[1.5rem] border border-zinc-200 bg-white/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/70">
              Use the type selector to classify the payment correctly.
            </li>
            <li className="rounded-[1.5rem] border border-zinc-200 bg-white/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/70">
              Double-check your payment history before retrying after an error.
            </li>
            <li className="rounded-[1.5rem] border border-zinc-200 bg-white/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/70">
              Card entry stays inside the existing Square-hosted secure field.
            </li>
          </ul>

          <div className="flex items-start gap-3 rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>Payment processing and authorization behavior are unchanged from the existing flow.</p>
          </div>
        </PortalCard>
      </div>
    </div>
  );
}
