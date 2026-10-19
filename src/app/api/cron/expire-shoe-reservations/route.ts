// Cron is a trusted server-only entry point.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const database = createAdminClient() as any;
  const { data, error } = await database.rpc("shoe_expire_reservations");
  if (error) return Response.json({ error: "Expiration failed" }, { status: 500 });
  return Response.json({ releasedPairs: data });
}
