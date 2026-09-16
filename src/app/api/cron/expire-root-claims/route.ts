import { NextResponse, type NextRequest } from "next/server";
// Cron endpoints are server-only and intentionally use the service client.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from "@/lib/supabase/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient() as any;
  const { data, error } = await admin.rpc("expire_unaccepted_root_claims");
  if (error) return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  const { data: staleUploads } = await admin
    .from("public_upload_intents")
    .select("id, kind, uploads")
    .is("finalized_at", null)
    .lt("expires_at", new Date().toISOString());
  for (const intent of staleUploads ?? []) {
    const paths = (intent.uploads as Array<{ path?: string }>)
      .map((upload) => upload.path)
      .filter((path): path is string => typeof path === "string");
    const bucket = intent.kind === "initiative" ? "initiative-evidence" : "scholarship-applications";
    if (paths.length) await admin.storage.from(bucket).remove(paths);
  }
  if (staleUploads?.length) {
    await admin.from("public_upload_intents").delete().in("id", staleUploads.map((intent: { id: string }) => intent.id));
  }
  return NextResponse.json({ expiredClaims: data ?? 0, expiredUploads: staleUploads?.length ?? 0 });
}
