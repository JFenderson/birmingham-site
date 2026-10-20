import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { parseShoeCheckInCode } from "@/lib/shoes/check-in";

export const metadata: Metadata = { title: "Shoes for Kids check-in | Birmingham Sigmas", robots: { index: false } };

export default async function ShoeCheckInPage({ searchParams }: { searchParams: Promise<{ code?: string | string[] }> }) {
  const rawCode = (await searchParams).code;
  const code = typeof rawCode === "string" ? parseShoeCheckInCode(rawCode) : null;
  if (!code) notFound();
  const staffPath = `/admin/shoes-for-kids?checkInCode=${encodeURIComponent(code)}#reservations`;
  const loginPath = `/login?redirect=${encodeURIComponent(staffPath)}`;

  return <main className="mx-auto max-w-2xl px-5 py-16 text-slate-900">
    <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#1748A3]">Shoes for Kids</p>
    <h1 className="mt-3 text-3xl font-bold">Shoe delivery check-in</h1>
    <p className="mt-4 text-slate-700">This QR code identifies a shoe reservation for authorized Tau Sigma staff. It does not include sponsor or student details.</p>
    <p className="mt-5 break-all rounded-xl bg-slate-100 p-4 font-mono text-sm">{code}</p>
    <div className="mt-7 flex flex-wrap gap-3">
      <Link href={staffPath} className="rounded-full bg-[#1748A3] px-5 py-3 font-semibold text-white">Open staff check-in</Link>
      <Link href={loginPath} className="rounded-full border border-[#1748A3] px-5 py-3 font-semibold text-[#1748A3]">Staff sign-in</Link>
    </div>
    <p className="mt-6 text-sm text-slate-600">Staff can also enter the reservation reference after signing in.</p>
  </main>;
}
