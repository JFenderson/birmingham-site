import { NextResponse, type NextRequest } from "next/server";
import { verifySquareSignature } from "@/lib/square/verify-webhook";
import { handleSquareWebhookEvent } from "@/lib/square/handle-webhook";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature");
  const notificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/square`;

  if (!signature || !verifySquareSignature(signature, notificationUrl, body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  await handleSquareWebhookEvent(event);

  return NextResponse.json({ received: true });
}
