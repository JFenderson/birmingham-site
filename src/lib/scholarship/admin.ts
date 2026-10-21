import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { SCHOLARSHIP_BUCKET } from "./application";

export type ScholarshipReviewRow = {
  id: string;
  applicant: { legalName?: string; school?: string; gpa?: number };
  status: string;
  created_at: string;
  files: Record<string, string>;
};

function scholarshipClient() {
  return createAdminClient() as unknown as SupabaseClient;
}

export async function listScholarshipApplications(chapterId: string) {
  const { data, error } = await scholarshipClient().from("scholarship_applications")
    .select("id, applicant, status, created_at, files")
    .eq("chapter_id", chapterId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ScholarshipReviewRow[];
}

export async function downloadScholarshipDocument(chapterId: string, id: string, name: string) {
  const client = scholarshipClient();
  const { data } = await client.from("scholarship_applications")
    .select("files")
    .eq("id", id)
    .eq("chapter_id", chapterId)
    .maybeSingle();
  const files = data?.files as Record<string, unknown> | undefined;
  const path = files?.[name];
  const prefix = `${chapterId}/${id}/${name}`;
  if (typeof path !== "string" || !path.startsWith(prefix)) return null;
  if (path !== prefix && !/^\.(pdf|docx|jpg|jpeg|png)$/.test(path.slice(prefix.length))) return null;
  const { data: file, error } = await client.storage.from(SCHOLARSHIP_BUCKET).download(path);
  if (error || !file) return null;
  return { file, extension: path === prefix ? "bin" : path.slice(prefix.length + 1) };
}
