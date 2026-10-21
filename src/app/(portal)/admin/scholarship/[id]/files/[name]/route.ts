import { requireChapterAdmin } from "@/lib/auth/authorization";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { SCHOLARSHIP_FILES } from "@/lib/scholarship/application";
import { downloadScholarshipDocument } from "@/lib/scholarship/admin";

const allowedNames = new Set<string>([
  ...SCHOLARSHIP_FILES.map((file) => file.name),
  "serviceProof",
  "signedApplication",
]);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; name: string }> }) {
  await requireChapterAdmin();
  const { chapterId } = await getTenantContext();
  const { id, name } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id) || !allowedNames.has(name)) {
    return new Response("Not found", { status: 404 });
  }

  const document = await downloadScholarshipDocument(chapterId, id, name);
  if (!document) return new Response("Not found", { status: 404 });
  return new Response(document.file, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${name}.${document.extension}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
