import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { getPublicShoePortal } from "@/lib/shoes/store";

export async function GET() {
  const tenant = await getTenantContext();
  if (tenant.chapterSlug !== "root") return Response.json({ error: "Unavailable" }, { status: 404 });
  try {
    return Response.json(await getPublicShoePortal(tenant.chapterId), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Campaign data unavailable" }, { status: 503 });
  }
}
