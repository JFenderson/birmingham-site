import Script from "next/script";
import { PaymentForm } from "./payment-form";

export default function PayPage() {
  const sandboxUrl = "https://sandbox.web.squarecdn.com/v1/square.js";
  const productionUrl = "https://web.squarecdn.com/v1/square.js";
  const src = process.env.NODE_ENV === "production" ? productionUrl : sandboxUrl;

  return (
    <div className="max-w-md space-y-6">
      <Script src={src} strategy="afterInteractive" />
      <h1 className="text-2xl font-semibold">Make a Payment</h1>
      <PaymentForm />
    </div>
  );
}
