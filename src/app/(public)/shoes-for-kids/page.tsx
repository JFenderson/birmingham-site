import type { Metadata } from "next";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { getPublicShoePortal } from "@/lib/shoes/store";
import { getShoeProgramContactEmail } from "@/lib/email/config";
import { ShoesPortal } from "./portal";

export const metadata: Metadata = { title: "Shoes for Kids — Adopt a Pair | Birmingham Sigmas" };

export default async function ShoesForKidsPage() {
  const tenant = await getTenantContext();
  if (tenant.chapterSlug !== "root") return <div className="mx-auto max-w-4xl px-6 py-20"><h1 className="text-3xl font-bold">Shoes for Kids</h1><p className="mt-4">Visit the Tau Sigma chapter site for this campaign.</p></div>;
  let portal;
  try { portal = await getPublicShoePortal(tenant.chapterId); }
  catch { portal = { campaign: null, requests: [], inventoryGroups: [], progress: null, error: "Campaign data is temporarily unavailable." }; }
  return <ShoesPortal {...portal} contactEmail={getShoeProgramContactEmail()} />;
}
