import Link from "next/link";
import { completeEmailSignIn } from "./actions";

export const metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" as const };

export default async function EmailSignInPage({ searchParams }: {
  searchParams: Promise<{ token_hash?: string; code?: string }>;
}) {
  const params = await searchParams;
  const hash = typeof params.token_hash === "string" ? params.token_hash : "";
  const code = typeof params.code === "string" ? params.code : "";
  return (
    <main className="mx-auto w-full max-w-md space-y-5 px-6 py-16">
      <h1 className="text-2xl font-bold text-navy">Welcome back, brother</h1>
      <p>Use this button to finish signing in to your member account.</p>
      {hash || code ? <form action={completeEmailSignIn}>
        <input type="hidden" name="token_hash" value={hash} />
        <input type="hidden" name="code" value={code} />
        <button className="min-h-12 w-full rounded-md bg-navy px-4 py-3 font-semibold text-white">Sign in to the Member Portal</button>
      </form> : <p>This link is incomplete. Please request a new one.</p>}
      <Link href="/login" className="block underline">Return to sign in</Link>
    </main>
  );
}
