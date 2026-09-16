"use server";

/* Server Actions are not client bundles; this action must use the service
 * client to finalize an anonymous, signed-upload submission. */
/* eslint-disable no-restricted-imports, @typescript-eslint/no-explicit-any */

import crypto from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { scholarshipApplicationSchema, isScholarshipOpen } from "@/lib/scholarship/application";
import { sendScholarshipNotification } from "@/lib/email/send-scholarship-notification";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateUploadFile, type AllowedFileType } from "@/lib/security/file-signature";

const BUCKET = "scholarship-applications";
const FILE_NAMES = ["transcript", "resume", "acceptanceLetter", "recommendationLetter", "serviceProof", "signedApplication", "photograph"] as const;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const satisfies readonly AllowedFileType[];
const MAX_FILE_BYTES = 10_000_000;
type UploadMetadata = { name: string; size: number };
type StoredUpload = { name: string; path: string };

async function allowScholarshipSubmission() {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limits = await Promise.all([
    checkRateLimit(`scholarship:ip:${ip}`, { limit: 3, windowMs: 24 * 60 * 60 * 1000 }),
    checkRateLimit("scholarship:global", { limit: 100, windowMs: 60 * 60 * 1000 }),
  ]);
  return limits.every((result) => result.success);
}

export async function prepareScholarshipApplication(rawInput: Record<string, unknown>, files: UploadMetadata[]) {
  if (!isScholarshipOpen()) return { error: "Scholarship applications are closed. Applications open October 1." };
  if (!(await allowScholarshipSubmission())) return { error: "Please wait before submitting another application." };
  const parsed = scholarshipApplicationSchema.safeParse(rawInput);
  const validFiles = files.length === FILE_NAMES.length && new Set(files.map((file) => file.name)).size === FILE_NAMES.length && files.every((file) => FILE_NAMES.includes(file.name as typeof FILE_NAMES[number]) && Number.isInteger(file.size) && file.size > 0 && file.size <= MAX_FILE_BYTES);
  if (!parsed.success || !validFiles) return { error: "Please complete all required fields and upload each document under 10 MB." };

  const { chapterId } = await getTenantContext();
  const id = crypto.randomUUID();
  const admin = createAdminClient();
  const uploads: StoredUpload[] = FILE_NAMES.map((name) => ({ name, path: `${chapterId}/${id}/${name}` }));
  const signed = await Promise.all(uploads.map(async (upload) => {
    const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(upload.path);
    return { ...upload, token: data?.token, error };
  }));
  if (signed.some((entry) => entry.error || !entry.token)) return { error: "We could not prepare secure document uploads." };
  const { error } = await (admin as any).from("public_upload_intents").insert({
    id, chapter_id: chapterId, kind: "scholarship", payload: parsed.data, uploads,
    expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
  });
  if (error) return { error: "We could not prepare your application." };
  return { id, uploads: signed.map(({ name, path, token }) => ({ name, path, token: token! })) };
}

export async function finalizeScholarshipApplication(id: string): Promise<{ error?: string; success?: true }> {
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id)) return { error: "Invalid application." };
  const admin = createAdminClient();
  const { data: intent } = await (admin as any).from("public_upload_intents")
    .select("chapter_id, payload, uploads, expires_at, finalized_at").eq("id", id).eq("kind", "scholarship").maybeSingle();
  if (!intent || intent.finalized_at || new Date(intent.expires_at).getTime() < Date.now()) return { error: "This upload session expired. Please start again." };
  const uploadedPaths: string[] = [];
  const files: Record<string, string> = {};
  for (const upload of intent.uploads as StoredUpload[]) {
    const { data: blob, error } = await admin.storage.from(BUCKET).download(upload.path);
    if (error || !blob) {
      await admin.storage.from(BUCKET).remove(uploadedPaths);
      return { error: "Every required document must finish uploading before submission." };
    }
    const file = new File([blob], upload.name, { type: blob.type });
    if (!await validateUploadFile(file, ALLOWED_TYPES, MAX_FILE_BYTES)) {
      await admin.storage.from(BUCKET).remove([...uploadedPaths, upload.path]);
      return { error: "One or more documents is not a valid PDF, JPG, or PNG under 10 MB." };
    }
    uploadedPaths.push(upload.path);
    files[upload.name] = upload.path;
  }
  const payload = scholarshipApplicationSchema.safeParse(intent.payload);
  if (!payload.success) return { error: "This upload session is invalid. Please start again." };
  const { error } = await (admin as any).from("scholarship_applications").insert({
    id, chapter_id: intent.chapter_id,
    applicant: { legalName: payload.data.legalName, email: payload.data.email, address: payload.data.address, school: payload.data.school, phone: payload.data.phone, dateOfBirth: payload.data.dateOfBirth, age: payload.data.age, citizenship: payload.data.citizenship, race: payload.data.race, ethnicity: payload.data.ethnicity, gpa: payload.data.gpa, major: payload.data.major, intendedSchool: payload.data.intendedSchool, scholarship: payload.data.scholarship },
    essays: payload.data.essay, files,
  });
  if (error) {
    await admin.storage.from(BUCKET).remove(uploadedPaths);
    return { error: "We could not submit your application. Please try again." };
  }
  await (admin as any).from("public_upload_intents").update({ finalized_at: new Date().toISOString() }).eq("id", id);
  await sendScholarshipNotification({ applicantEmail: payload.data.email, applicantName: payload.data.legalName, applicationId: id });
  return { success: true };
}
