import { requireRole } from "@/lib/auth/rbac";
import { FolderLock } from "lucide-react";
import { PortalCard } from "@/components/portal/portal-card";
import { PortalEmptyState } from "@/components/portal/portal-empty-state";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { PortalStatusBadge } from "@/components/portal/portal-status-badge";
import { DownloadButton } from "./download-button";
import { DeleteButton } from "./delete-button";

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
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <PortalPageHeader
        eyebrow="Records & Documents"
        title="Document Vault"
        description="Review the chapter’s secure records, minutes, financials, and reference material from a cleaner mobile-first library."
        badge={
          <PortalStatusBadge variant={byCategory.size > 0 ? "info" : "neutral"}>
            {byCategory.size > 0 ? `${documents?.length ?? 0} files` : "Vault empty"}
          </PortalStatusBadge>
        }
        action={
          canUpload ? (
            <a
              href="/vault/upload"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark"
            >
              Upload
            </a>
          ) : null
        }
      />

      {byCategory.size === 0 ? (
        <PortalEmptyState
          icon={FolderLock}
          title="No documents yet"
          description="Approved chapter uploads will appear here once officers add minutes, bylaws, or financial records."
          action={
            canUpload ? (
              <a
                href="/vault/upload"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark"
              >
                Upload the first document
              </a>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {[...byCategory.entries()].map(([category, docs]) => (
            <PortalCard key={category} as="section" className="space-y-4 rounded-[2rem] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                    {CATEGORY_LABELS[category] ?? category}
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {(docs ?? []).length} {(docs ?? []).length === 1 ? "document" : "documents"}
                  </p>
                </div>
                <PortalStatusBadge variant="info">
                  {CATEGORY_LABELS[category] ?? category}
                </PortalStatusBadge>
              </div>

              <div className="space-y-3">
                {(docs ?? []).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col gap-3 rounded-[1.5rem] border border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-950 dark:text-zinc-50">{doc.title}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Added {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <DownloadButton
                        bucket={doc.storage_bucket}
                        path={doc.storage_path}
                      />
                      {canUpload && <DeleteButton documentId={doc.id} />}
                    </div>
                  </div>
                ))}
              </div>
            </PortalCard>
          ))}
        </div>
      )}
    </div>
  );
}
