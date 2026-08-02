"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { finalizeUpload } from "./actions";
import type { MemberRole } from "@/types/domain";

const CATEGORY_ROLES: Record<string, MemberRole[]> = {
  bylaws: ["Admin", "Secretary", "Treasurer"],
  financials: ["Treasurer", "Admin"],
  minutes: ["Secretary", "Admin"],
};

// crypto.randomUUID() is only defined in "secure contexts" — HTTPS, or the
// browser's special-cased "localhost" literal. This app's documented local
// dev workflow uses real subdomains (e.g. http://miles.lvh.me:3000) served
// over plain HTTP, which does NOT count as secure even though lvh.me
// resolves to 127.0.0.1 — so crypto.randomUUID() throws there. Fall back to
// a non-crypto but equally collision-resistant id when it's unavailable.
function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function categoriesFor(role: MemberRole): string[] {
  return Object.entries(CATEGORY_ROLES)
    .filter(([, roles]) => roles.includes(role))
    .map(([category]) => category);
}

export function UploadForm({ role }: { role: MemberRole }) {
  const router = useRouter();
  const categories = categoriesFor(role);
  const [category, setCategory] = useState(categories[0] ?? "");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !category || !title.trim()) return;
    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setPending(false);
        setError("Session expired — please sign in again.");
        return;
      }

      // Path convention matches 00000000000011_storage_buckets.sql exactly:
      // '{chapter_id}/{uuid}-{filename}'. chapterId isn't known client-side
      // here without an extra round-trip, so this reads the caller's own
      // chapter_members row (RLS-scoped, safe) to get it.
      const { data: membership } = await supabase
        .from("chapter_members")
        .select("chapter_id")
        .eq("profile_id", user.id)
        .eq("is_deleted", false)
        .limit(1)
        .maybeSingle();
      if (!membership) {
        setPending(false);
        setError("Could not resolve your chapter.");
        return;
      }

      const path = `${membership.chapter_id}/${generateId()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from(category)
        .upload(path, file);

      if (uploadError) {
        setPending(false);
        setError("Upload failed — check your role permits this category.");
        return;
      }

      const result = await finalizeUpload({ category, title, storagePath: path });
      setPending(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/vault");
      router.refresh();
    } catch {
      setPending(false);
      setError("Something went wrong — please try again.");
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c[0]?.toUpperCase()}{c.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">File</label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending || !file}
        className="w-full rounded-md bg-navy px-4 py-2 font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
      >
        {pending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
