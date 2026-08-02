"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function EnrollForm() {
  const router = useRouter();
  const supabase = createClient();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = data?.totp?.find((f) => f.status === "verified");
      if (verified) {
        setAlreadyEnrolled(true);
        return;
      }
      const { data: enrollData, error: enrollError } =
        await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (enrollError) {
        setError(enrollError.message);
        return;
      }
      setFactorId(enrollData.id);
      setQrCode(enrollData.totp.qr_code);
    })();
  }, [supabase]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setPending(true);
    setError(null);

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) {
      setPending(false);
      setError(challengeError?.message ?? "Could not start verification.");
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    setPending(false);
    if (verifyError) {
      setError("Invalid code — try again.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (alreadyEnrolled) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        MFA is already enrolled on this account.
      </p>
    );
  }

  if (!qrCode) {
    return <p className="text-sm text-zinc-500">Setting up…</p>;
  }

  return (
    <form onSubmit={(e) => void handleVerify(e)} className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Scan this QR code with an authenticator app (Google Authenticator,
        1Password, Authy), then enter the 6-digit code it generates.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrCode} alt="MFA QR code" className="h-48 w-48" />
      <div className="space-y-1">
        <label className="text-sm font-medium">Verification Code</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending || code.length !== 6}
        className="w-full rounded-md bg-navy px-4 py-2 font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
      >
        {pending ? "Verifying…" : "Verify and Enable"}
      </button>
    </form>
  );
}
