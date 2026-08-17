"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "loading" | "needs-enrollment" | "needs-step-up" | "already-verified";

export function EnrollForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const initializedRef = useRef(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<Mode>("loading");

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;

    void (async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = data?.totp?.find((f) => f.status === "verified");

      if (verified) {
        // A verified factor already exists. That does NOT mean this
        // session is aal2 — signInWithPassword always issues aal1, even
        // for an already-enrolled user. Check the session's actual
        // assurance level before deciding whether there's anything left
        // for the user to do here.
        const { data: aal } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal?.currentLevel === "aal2") {
          setMode("already-verified");
          return;
        }
        // Session is only aal1 despite the existing factor — the user
        // needs to step up via a fresh challenge/verify against their
        // existing factor. No new QR code; same factor, same secret.
        setFactorId(verified.id);
        setMode("needs-step-up");
        return;
      }

      const existingUnverified = data?.totp?.find((f) => f.status !== "verified");
      if (existingUnverified) {
        // If an enrollment factor already exists, avoid creating a duplicate
        // factor (which can return 422) and continue with challenge/verify.
        setFactorId(existingUnverified.id);
        setMode("needs-step-up");
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
      setMode("needs-enrollment");
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

  if (mode === "already-verified") {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        MFA is already enrolled on this account.
      </p>
    );
  }

  if (mode === "loading" || (mode === "needs-enrollment" && !qrCode)) {
    return <p className="text-sm text-zinc-500">Setting up…</p>;
  }

  return (
    <form onSubmit={(e) => void handleVerify(e)} className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {mode === "needs-enrollment"
          ? "Scan this QR code with an authenticator app (Google Authenticator, 1Password, Authy), then enter the 6-digit code it generates."
          : "Enter the 6-digit code from your authenticator app to verify it's you."}
      </p>
      {mode === "needs-enrollment" && qrCode && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrCode} alt="MFA QR code" className="h-48 w-48" />
      )}
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
