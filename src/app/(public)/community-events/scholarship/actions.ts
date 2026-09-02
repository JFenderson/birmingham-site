"use server";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import {
  scholarshipApplicationSchema,
  isScholarshipOpen,
} from "@/lib/scholarship/application";
import { sendScholarshipNotification } from "@/lib/email/send-scholarship-notification";
export async function submitScholarshipApplication(formData: FormData) {
  if (!isScholarshipOpen())
    return {
      error:
        "Scholarship applications are closed. Applications open October 1.",
    };
  const raw = Object.fromEntries(formData.entries());
  const parsed = scholarshipApplicationSchema.safeParse(raw);
  if (!parsed.success) return { error: "Please complete all required fields." };
  const { chapterId } = await getTenantContext();
  const id = crypto.randomUUID();
  const admin = createAdminClient();
  const fileNames = ["transcript", "resume", "acceptanceLetter", "recommendationLetter", "serviceProof", "signedApplication", "photograph"];
  const files: Record<string, string> = {};
  for (const name of fileNames) {
    const file = formData.get(name);
    if (!(file instanceof File) || file.size === 0 || file.size > 10_000_000) return { error: "Each required document must be under 10 MB." };
    const path = `${chapterId}/${id}/${name}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const uploaded = await admin.storage.from("scholarship-applications").upload(path, file, { contentType: file.type, upsert: false });
    if (uploaded.error) return { error: "We could not save the uploaded documents." };
    files[name] = path;
  }
  const { error } = await (admin as any)
    .from("scholarship_applications")
    .insert({
      id,
      chapter_id: chapterId,
      applicant: {
        legalName: parsed.data.legalName,
        email: parsed.data.email,
        address: parsed.data.address,
        school: parsed.data.school,
        phone: parsed.data.phone,
        dateOfBirth: parsed.data.dateOfBirth,
        age: parsed.data.age,
        citizenship: parsed.data.citizenship,
        race: parsed.data.race,
        ethnicity: parsed.data.ethnicity,
        gpa: parsed.data.gpa,
        major: parsed.data.major,
        intendedSchool: parsed.data.intendedSchool,
        scholarship: parsed.data.scholarship,
      },
      essays: parsed.data.essay,
      files,
    });
  if (error)
    return { error: "We could not submit your application. Please try again." };
  await sendScholarshipNotification({
    applicantEmail: parsed.data.email,
    applicantName: parsed.data.legalName,
    applicationId: id,
  });
  return { success: true };
}
