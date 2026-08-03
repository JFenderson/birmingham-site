import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await checkRateLimit(`${ip}:health`, {
    limit: 60,
    windowMs: 60_000,
    failOpen: true,
  });

  if (!success) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  return NextResponse.json({ status: "ok" });
}
