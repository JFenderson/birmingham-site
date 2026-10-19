"use server";

import { headers } from "next/headers";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { checkDatabaseRateLimit } from "@/lib/rate-limit/database";
import { reservationSchema } from "@/lib/shoes/model";
import { createShoeReservation } from "@/lib/shoes/store";
import { sendShoeReservationNotifications } from "@/lib/shoes/notifications";

export async function reserveShoes(input: unknown): Promise<
  | { success: true; reference: string; token: string; expiresAt: string; checkInCode: string; emailSent: boolean }
  | { success: false; error: string }
> {
  const parsed = reservationSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Check the sponsor details and selected pairs." };
  const tenant = await getTenantContext();
  if (tenant.chapterSlug !== "root") return { success: false, error: "This campaign is available on the Tau Sigma site." };
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  try {
    const allowed = await checkDatabaseRateLimit(`shoe-reservation:${ip}`, 5, 10 * 60_000, process.env.VERCEL_ENV ?? "dev");
    if (!allowed) return { success: false, error: "Too many attempts. Please try again later." };
  } catch {
    return { success: false, error: "Reservations are temporarily unavailable. Please try again later." };
  }
  try {
    const reservation = await createShoeReservation(tenant.chapterId, parsed.data);
    const emailSent = await sendShoeReservationNotifications({
      to: parsed.data.email, name: parsed.data.name, reference: reservation.reference,
      token: reservation.token, expiresAt: reservation.expiresAt,
      phone: parsed.data.phone, pairCount: parsed.data.selections.reduce((sum, selection) => sum + selection.quantity, 0),
      deliveryMethod: parsed.data.deliveryMethod,
    });
    return { success: true, ...reservation, emailSent };
  } catch (error) {
    if (error instanceof Error && error.message.includes("pairs were just reserved")) return { success: false, error: error.message };
    console.error("[shoes-for-kids] reservation failed", error);
    return { success: false, error: "We could not reserve those pairs. Refresh availability and try again." };
  }
}
