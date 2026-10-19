import { requireShoeRole } from "@/lib/shoes/authorization";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { getShoeAdminData } from "@/lib/shoes/admin";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const staff = await requireShoeRole(["director", "finance"]);
  const tenant = await getTenantContext();
  if (tenant.chapterSlug !== "root") return new Response(null, { status: 404 });
  const campaignId = new URL(request.url).searchParams.get("campaign") ?? undefined;
  const data = await getShoeAdminData(tenant.chapterId, campaignId, staff.role);
  if (!data.campaign || (campaignId && data.campaign.id !== campaignId)) return new Response(null, { status: 404 });
  const lines = ["Campaign,Public Request ID,School Code,Size System,Shoe Size,Width,Shoe Type,Status,Reservation Deadline"];
  for (const row of data.requests) lines.push([
    data.campaign.code,row.public_ref,row.school_code,row.size_system,row.shoe_size,
    row.width,row.shoe_type,row.status,row.reserved_until,
  ].map(escapeCsv).join(","));
  return new Response(lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${data.campaign.code}-requests.csv"`, "Cache-Control": "no-store" },
  });
}
