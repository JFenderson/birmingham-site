import Link from "next/link";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { getShoeAdminData } from "@/lib/shoes/admin";
import { ShoesAdminConsole } from "./shoes-admin-console";
import { requireShoeStaff } from "@/lib/shoes/authorization";

export default async function ShoesForKidsAdminPage({ searchParams }: { searchParams: Promise<{ campaign?: string }> }) {
  const tenant = await getTenantContext();
  if (tenant.chapterSlug !== "root") return <p>Campaign management is available on the Tau Sigma chapter site.</p>;
  const staff = await requireShoeStaff();
  let data;
  try {
    data = await getShoeAdminData(tenant.chapterId, (await searchParams).campaign, staff.role);
  } catch {
    return <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6"><h2 className="text-xl font-bold text-amber-950">Shoes for Kids database is not ready</h2><p className="mt-2 text-amber-900">Apply the Shoes for Kids migration before managing campaigns.</p><Link href="/admin" className="mt-4 inline-block underline">Back to admin</Link></div>;
  }
  return <ShoesAdminConsole data={data} role={staff.role} />;
}
