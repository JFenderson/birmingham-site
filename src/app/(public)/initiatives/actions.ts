"use server";

/* Server Actions are not client bundles; this action must use the service
 * client to finalize an anonymous, signed-upload submission. */
/* eslint-disable no-restricted-imports, @typescript-eslint/no-explicit-any */

import crypto from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { estimateStepsFromMiles, initiativeSubmissionSchema } from "@/lib/initiatives/tracker";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateUploadFile } from "@/lib/security/file-signature";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export async function prepareInitiativeUpload(raw: Record<string, unknown>, file: { name: string; size: number }) {
  if (String(raw.website ?? "").trim()) return { error: "Unable to prepare this entry." };
  if (!Number.isInteger(file.size) || file.size <= 0 || file.size > MAX_FILE_BYTES) return { error: "Upload a JPG, PNG, WebP, or PDF under 8 MB." };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limits = await Promise.all([
    checkRateLimit(`initiative:ip:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 }),
    checkRateLimit("initiative:global", { limit: 250, windowMs: 60 * 60 * 1000 }),
  ]);
  if (limits.some((limit) => !limit.success)) return { error: "Please wait before submitting another entry." };
  const parsed = initiativeSubmissionSchema.safeParse({ ...raw, evidencePath: "pending" });
  if (!parsed.success) return { error: "Please complete all required fields." };
  const durationMinutes = (parsed.data.durationHours ?? 0) * 60 + (parsed.data.durationMinutes ?? 0);
  if (durationMinutes > 1440) return { error: "Time spent cannot be more than 24 hours." };
  const { chapterId } = await getTenantContext();
  const id = crypto.randomUUID();
  const path = `${chapterId}/${id}/evidence`;
  const admin = createAdminClient();
  const { data: signed, error: signedError } = await admin.storage.from("initiative-evidence").createSignedUploadUrl(path);
  if (signedError || !signed?.token) return { error: "We could not prepare a secure proof upload." };
  const { error } = await (admin as any).from("public_upload_intents").insert({
    id, chapter_id: chapterId, kind: "initiative", payload: parsed.data,
    uploads: [{ name: "evidence", path }], expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
  });
  if (error) return { error: "We could not prepare your submission." };
  return { id, path, token: signed.token };
}

export async function finalizeInitiativeUpload(id: string): Promise<{ error?: string; success?: true }> {
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id)) return { error: "Invalid submission." };
  const admin = createAdminClient();
  const { data: intent } = await (admin as any).from("public_upload_intents")
    .select("chapter_id, payload, uploads, expires_at, finalized_at").eq("id", id).eq("kind", "initiative").maybeSingle();
  const upload = intent?.uploads?.[0] as { path?: string } | undefined;
  if (!intent || intent.finalized_at || new Date(intent.expires_at).getTime() < Date.now() || !upload?.path) return { error: "This upload session expired. Please start again." };
  const { data: blob, error: downloadError } = await admin.storage.from("initiative-evidence").download(upload.path);
  const verifiedType = !downloadError && blob ? await validateUploadFile(new File([blob], "evidence", { type: blob.type }), ["image/jpeg", "image/png", "image/webp", "application/pdf"], MAX_FILE_BYTES) : null;
  if (!verifiedType) {
    await admin.storage.from("initiative-evidence").remove([upload.path]);
    return { error: "The uploaded file is not a valid JPG, PNG, WebP, or PDF." };
  }
  const value = initiativeSubmissionSchema.safeParse(intent.payload);
  if (!value.success) return { error: "This upload session is invalid. Please start again." };
  const durationMinutes = (value.data.durationHours ?? 0) * 60 + (value.data.durationMinutes ?? 0);
  const submittedSteps = value.data.initiative === "steps" ? value.data.steps : undefined;
  const { error } = await (admin as any).from("initiative_submissions").insert({
    chapter_id: intent.chapter_id, initiative: value.data.initiative, first_name: value.data.firstName, last_name: value.data.lastName,
    business_name: value.data.initiative === "black_spending" ? value.data.businessName : null,
    black_owned_confirmed: value.data.initiative === "black_spending" ? value.data.blackOwnedConfirmed : null,
    amount_cents: value.data.initiative === "black_spending" ? value.data.amountCents : null,
    spent_on: value.data.initiative === "black_spending" ? value.data.spentOn : null,
    steps: value.data.initiative === "steps" ? submittedSteps ?? estimateStepsFromMiles(value.data.distanceMiles ?? 0) : null,
    steps_source: value.data.initiative === "steps" && submittedSteps === undefined ? "estimated" : "submitted",
    steps_per_mile_used: value.data.initiative === "steps" && submittedSteps === undefined ? 2100 : null,
    submission_source: "public_submission", distance_miles: value.data.initiative === "steps" ? (value.data.distanceMiles ?? null) : null,
    tracked_on: value.data.initiative === "steps" ? value.data.trackedOn : null,
    duration_minutes: value.data.durationHours === undefined && value.data.durationMinutes === undefined ? null : durationMinutes,
    evidence_path: upload.path, evidence_content_type: verifiedType, evidence_size_bytes: blob!.size,
  });
  if (error) {
    await admin.storage.from("initiative-evidence").remove([upload.path]);
    return { error: "Could not save the submission." };
  }
  await (admin as any).from("public_upload_intents").update({ finalized_at: new Date().toISOString() }).eq("id", id);
  return { success: true };
}

export async function submitInitiative(formData: FormData) {
  if (String(formData.get("website") ?? "").trim()) return { success: true };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limits = await Promise.all([
    checkRateLimit(`initiative:ip:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 }),
    checkRateLimit("initiative:global", { limit: 250, windowMs: 60 * 60 * 1000 }),
  ]);
  if (limits.some((limited) => !limited.success))
    return { error: "Please wait before submitting another entry." };
  const file = formData.get("evidence");
  if (
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > MAX_FILE_BYTES ||
    !TYPES.has(file.type)
  )
    return { error: "Upload a JPG, PNG, WebP, or PDF under 8 MB." };
  const detectedType = await validateUploadFile(file, ["image/jpeg", "image/png", "image/webp", "application/pdf"], MAX_FILE_BYTES);
  if (!detectedType) return { error: "The uploaded file is not a valid JPG, PNG, WebP, or PDF." };
  const raw = Object.fromEntries(formData.entries());
  const parsed = initiativeSubmissionSchema.safeParse({
    ...raw,
    durationHours: raw.durationHours,
    durationMinutes: raw.durationMinutes,
    amountCents: raw.amountCents,
    steps: raw.steps,
    evidencePath: "pending",
  });
  if (!parsed.success) return { error: "Please complete all required fields." };
  const durationMinutes =
    (parsed.data.durationHours ?? 0) * 60 +
    (parsed.data.durationMinutes ?? 0);
  if (durationMinutes > 1440)
    return { error: "Time spent cannot be more than 24 hours." };
  const { chapterId } = await getTenantContext();
  const token = crypto.randomBytes(24).toString("hex");
  const path = `${chapterId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const admin = createAdminClient();
  const upload = await admin.storage
    .from("initiative-evidence")
    .upload(path, file, { contentType: detectedType, upsert: false });
  if (upload.error) return { error: "Could not save the proof file." };
  const value = parsed.data;
  const submittedSteps = value.initiative === "steps" ? value.steps : undefined;
  // The generated Supabase types are refreshed from migrations in deployment; this
  // migration is intentionally shipped alongside the feature.
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
    steps: value.initiative === "steps" ? submittedSteps ?? estimateStepsFromMiles(value.distanceMiles ?? 0) : null,
    steps_source: value.initiative === "steps" && submittedSteps === undefined ? "estimated" : "submitted",
    steps_per_mile_used: value.initiative === "steps" && submittedSteps === undefined ? 2100 : null,
    submission_source: "public_submission",
    distance_miles:
      value.initiative === "steps" ? (value.distanceMiles ?? null) : null,
    tracked_on: value.initiative === "steps" ? value.trackedOn : null,
    duration_minutes:
      value.durationHours === undefined && value.durationMinutes === undefined
        ? null
        : durationMinutes,
    evidence_path: path,
    evidence_content_type: detectedType,
    evidence_size_bytes: file.size,
    cleanup_token_hash: crypto.createHash("sha256").update(token).digest("hex"),
  });
  if (error) {
    await admin.storage.from("initiative-evidence").remove([path]);
    return { error: "Could not save the submission." };
  }
  return { success: true, token };
}
