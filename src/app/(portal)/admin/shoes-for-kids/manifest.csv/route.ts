import { requireShoeRole } from "@/lib/shoes/authorization";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { getShoeAdminData } from "@/lib/shoes/admin";

function csv(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"','""')}"`;
}

export async function GET(request: Request) {
  const staff = await requireShoeRole(["director","distribution"]);
  const tenant = await getTenantContext();
  if (tenant.chapterSlug !== "root") return new Response(null, { status: 404 });
  const query = new URL(request.url).searchParams;
  const campaignId = query.get("campaign") ?? "";
  const school = query.get("school") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(campaignId) || !/^[\w-]{1,40}$/.test(school)) return new Response(null, { status: 400 });
  const data = await getShoeAdminData(tenant.chapterId, campaignId, staff.role);
  if (data.campaign?.id !== campaignId) return new Response(null, { status: 404 });
  const rows = data.requests.filter((row: { status: string; school_code: string }) => row.school_code === school && ["received","purchased"].includes(row.status));
  const lines = ["Campaign,School Code,Anonymous Request ID,Size System,Shoe Size,Width,Shoe Type,Fulfillment"];
  for (const row of rows) lines.push([data.campaign.code,row.school_code,row.public_ref,row.size_system,row.shoe_size,row.width,row.shoe_type,row.status].map(csv).join(","));
  return new Response(lines.join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${data.campaign.code}-${school}-manifest.csv"`, "Cache-Control": "no-store" } });
}
