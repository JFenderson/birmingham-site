"use server";

import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { initiativeSubmissionSchema } from "@/lib/initiatives/tracker";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export async function submitInitiative(formData: FormData) {
  if (String(formData.get("website") ?? "").trim()) return { success: true };
  const limited = await checkRateLimit(
    `initiative:${String(formData.get("firstName") ?? "unknown").slice(0, 80)}`,
    { limit: 10, windowMs: 60 * 60 * 1000, failOpen: true },
  );
  if (!limited.success)
    return { error: "Please wait before submitting another entry." };
  const file = formData.get("evidence");
  if (
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > MAX_FILE_BYTES ||
    !TYPES.has(file.type)
  )
    return { error: "Upload a JPG, PNG, WebP, or PDF under 8 MB." };
  const raw = Object.fromEntries(formData.entries());
  const parsed = initiativeSubmissionSchema.safeParse({
    ...raw,
    durationMinutes: raw.durationMinutes,
    amountCents: raw.amountCents,
    steps: raw.steps,
    evidencePath: "pending",
  });
  if (!parsed.success) return { error: "Please complete all required fields." };
  const { chapterId } = await getTenantContext();
  const token = crypto.randomBytes(24).toString("hex");
  const path = `${chapterId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const admin = createAdminClient();
  const upload = await admin.storage
    .from("initiative-evidence")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upload.error) return { error: "Could not save the proof file." };
  const value = parsed.data;
  // The generated Supabase types are refreshed from migrations in deployment; this
  // migration is intentionally shipped alongside the feature.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const submissions = (admin as any).from("initiative_submissions");
  const { error } = await submissions.insert({
    chapter_id: chapterId,
    initiative: value.initiative,
    first_name: value.firstName,
    last_name: value.lastName,
    business_name:
      value.initiative === "black_spending" ? value.businessName : null,
    black_owned_confirmed:
      value.initiative === "black_spending" ? value.blackOwnedConfirmed : null,
    amount_cents:
      value.initiative === "black_spending" ? value.amountCents : null,
    spent_on: value.initiative === "black_spending" ? value.spentOn : null,
    steps: value.initiative === "steps" ? value.steps : null,
    distance_miles:
      value.initiative === "steps" ? (value.distanceMiles ?? null) : null,
    tracked_on: value.initiative === "steps" ? value.trackedOn : null,
    duration_minutes: value.durationMinutes,
    evidence_path: path,
    evidence_content_type: file.type,
    evidence_size_bytes: file.size,
    cleanup_token_hash: crypto.createHash("sha256").update(token).digest("hex"),
  });
  if (error) {
    await admin.storage.from("initiative-evidence").remove([path]);
    return { error: "Could not save the submission." };
  }
  return { success: true, token };
}
