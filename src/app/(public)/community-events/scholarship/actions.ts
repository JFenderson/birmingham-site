"use server";

/* Server Actions are not client bundles; this action uses the service client
 * to finalize anonymous, signed-upload submissions. */
/* eslint-disable no-restricted-imports, @typescript-eslint/no-explicit-any */

import crypto from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import {
  getScholarshipContentType,
  isScholarshipOpen,
  scholarshipApplicationSchema,
  SCHOLARSHIP_BUCKET,
  SCHOLARSHIP_DEADLINE_LABEL,
  SCHOLARSHIP_FILES,
  type ScholarshipFileName,
} from "@/lib/scholarship/application";
import { validateEssayFile } from "@/lib/scholarship/validate-essay-file";
import { sendScholarshipNotification } from "@/lib/email/send-scholarship-notification";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateUploadFile, type AllowedFileType } from "@/lib/security/file-signature";

type UploadMetadata = { name: string; size: number; filename: string };
type StoredUpload = { name: ScholarshipFileName; path: string; contentType: string };

async function allowScholarshipSubmission() {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limits = await Promise.all([
    checkRateLimit(`scholarship:ip:${ip}`, { limit: 3, windowMs: 24 * 60 * 60 * 1000 }),
    checkRateLimit("scholarship:global", { limit: 100, windowMs: 60 * 60 * 1000 }),
  ]);
  return limits.every((result) => result.success);
}

function validateFileList(files: UploadMetadata[]) {
  if (!Array.isArray(files) || files.length !== SCHOLARSHIP_FILES.length) return null;
  const uploads: { name: ScholarshipFileName; extension: string; contentType: string }[] = [];
  for (const required of SCHOLARSHIP_FILES) {
    const matches = files.filter((file) => file && file.name === required.name);
    if (matches.length !== 1) return null;
    const file = matches[0]!;
    if (!Number.isInteger(file.size) || file.size <= 0 || file.size > required.maxBytes) return null;
    const format = getScholarshipContentType(required.name, file.filename);
    if (!format) return null;
    uploads.push({ name: required.name, ...format });
  }
  return uploads;
}

export async function prepareScholarshipApplication(rawInput: Record<string, unknown>, files: UploadMetadata[]) {
  if (!isScholarshipOpen()) return { error: `Scholarship applications closed ${SCHOLARSHIP_DEADLINE_LABEL}.` };
  if (!(await allowScholarshipSubmission())) return { error: "Please wait before submitting another application." };
  const parsed = scholarshipApplicationSchema.safeParse(rawInput);
  const validFiles = validateFileList(files);
  if (!parsed.success || !validFiles) return { error: "Please complete all required fields and choose valid files within the stated size limits." };

  const { chapterId } = await getTenantContext();
  const id = crypto.randomUUID();
  const admin = createAdminClient();
  const uploads: StoredUpload[] = validFiles.map(({ name, extension, contentType }) => ({
    name,
    path: `${chapterId}/${id}/${name}.${extension}`,
    contentType,
  }));
  const signed = await Promise.all(uploads.map(async (upload) => {
    const { data, error } = await admin.storage.from(SCHOLARSHIP_BUCKET).createSignedUploadUrl(upload.path);
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
  if (!isScholarshipOpen()) return { error: `Scholarship applications closed ${SCHOLARSHIP_DEADLINE_LABEL}.` };
  const admin = createAdminClient();
  const { data: intent } = await (admin as any).from("public_upload_intents")
    .select("chapter_id, payload, uploads, expires_at, finalized_at").eq("id", id).eq("kind", "scholarship").maybeSingle();
  if (!intent || intent.finalized_at || new Date(intent.expires_at).getTime() < Date.now()) return { error: "This upload session expired. Please start again." };

  const files: Record<string, string> = {};
  for (const upload of intent.uploads as StoredUpload[]) {
    const { data: blob, error } = await admin.storage.from(SCHOLARSHIP_BUCKET).download(upload.path);
    if (error || !blob) return { error: "Every required document must finish uploading before submission." };
    const file = new File([blob], upload.path, { type: blob.type });
    const allowed: readonly AllowedFileType[] = upload.name === "photograph"
      ? ["image/jpeg", "image/png"]
      : ["application/pdf", "image/jpeg", "image/png"];
    const validatedType = upload.name === "essay"
      ? await validateEssayFile(file)
      : await validateUploadFile(file, allowed, 10_000_000);
    if (!validatedType || validatedType !== upload.contentType) {
      await admin.storage.from(SCHOLARSHIP_BUCKET).remove((intent.uploads as StoredUpload[]).map((entry) => entry.path));
      return { error: "A document did not match its required file type or size. Please start again." };
    }
    files[upload.name] = upload.path;
  }
  if (!SCHOLARSHIP_FILES.every(({ name }) => files[name])) return { error: "Every required document must be uploaded." };
  const payload = scholarshipApplicationSchema.safeParse(intent.payload);
  if (!payload.success) return { error: "This upload session is invalid. Please start again." };
  const { error } = await (admin as any).from("scholarship_applications").insert({
    id, chapter_id: intent.chapter_id,
    applicant: {
      legalName: payload.data.legalName, email: payload.data.email, address: payload.data.address,
      school: payload.data.school, phone: payload.data.phone, dateOfBirth: payload.data.dateOfBirth,
      age: payload.data.age, citizenship: payload.data.citizenship, race: payload.data.race,
      ethnicity: payload.data.ethnicity, gpa: payload.data.gpa, major: payload.data.major,
      intendedSchool: payload.data.intendedSchool,
    },
    essays: null, essay_file_path: files.essay, files,
  });
  if (error) return { error: "We could not submit your application. Please try again." };
  await (admin as any).from("public_upload_intents").update({ finalized_at: new Date().toISOString() }).eq("id", id);
  await sendScholarshipNotification({ applicantEmail: payload.data.email, applicantName: payload.data.legalName, applicationId: id });
  return { success: true };
}
