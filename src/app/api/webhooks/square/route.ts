import { NextResponse, type NextRequest } from "next/server";
import { verifySquareSignature } from "@/lib/square/verify-webhook";
import { handleSquareWebhookEvent } from "@/lib/square/handle-webhook";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature");
  // Square's HMAC signature is computed over the exact URL registered in the
  // Square dashboard for the environment that received the webhook — for a
  // preview deploy that's the generated *.vercel.app host, not
  // NEXT_PUBLIC_SITE_URL. Derive it from the incoming request instead so it
  // matches whatever host Square actually delivered to.
  const notificationUrl = `${request.nextUrl.origin}/api/webhooks/square`;

  if (!signature || !verifySquareSignature(signature, notificationUrl, body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: Parameters<typeof handleSquareWebhookEvent>[0];
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await handleSquareWebhookEvent(event);

  return NextResponse.json({ received: true });
}
