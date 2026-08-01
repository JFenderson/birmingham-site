import { requireRole } from "@/lib/auth/rbac";
import { DownloadButton } from "./download-button";

const ALL_ROLES = [
  "Member",
  "Treasurer",
  "Secretary",
  "Intake Director",
  "Admin",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  bylaws: "Bylaws",
  financials: "Financials",
  minutes: "Minutes",
  other: "Other",
};

export default async function VaultPage() {
  const { supabase, chapterId, role } = await requireRole(ALL_ROLES);

  const { data: documents } = await supabase
    .from("documents")
    .select("id, category, title, storage_bucket, storage_path, created_at")
    .eq("chapter_id", chapterId)
    .eq("is_deleted", false)
    .order("category", { ascending: true })
    .order("created_at", { ascending: false });

  const byCategory = new Map<string, typeof documents>();
  for (const doc of documents ?? []) {
    const list = byCategory.get(doc.category) ?? [];
    list.push(doc);
    byCategory.set(doc.category, list);
  }

  const canUpload = role === "Admin" || role === "Secretary" || role === "Treasurer";

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Document Vault</h1>
        {canUpload && (
          <a
            href="/vault/upload"
            className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark"
          >
            Upload
          </a>
        )}
      </div>

      {byCategory.size === 0 ? (
        <p className="text-sm text-zinc-500">No documents yet.</p>
      ) : (
        [...byCategory.entries()].map(([category, docs]) => (
          <div key={category}>
            <h2 className="text-sm font-semibold uppercase text-zinc-500">
              {CATEGORY_LABELS[category] ?? category}
            </h2>
            <div className="mt-3 space-y-2">
              {(docs ?? []).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-800"
                >
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <DownloadButton
                    bucket={doc.storage_bucket}
                    path={doc.storage_path}
                  />
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
