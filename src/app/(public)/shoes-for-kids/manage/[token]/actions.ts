"use server";

import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { cancelShoeReservation } from "@/lib/shoes/store";

export async function cancelMyReservation(token: string) {
  const tenant = await getTenantContext();
  if (tenant.chapterSlug !== "root") return { success: false };
  const success = await cancelShoeReservation(tenant.chapterId, token);
  revalidatePath(`/shoes-for-kids/manage/${token}`);
  revalidatePath("/shoes-for-kids");
  return { success };
}
