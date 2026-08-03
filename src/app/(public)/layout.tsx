import { getCurrentChapter } from "@/lib/tenant/get-chapter";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const chapter = await getCurrentChapter();

  return (
    <div className="flex flex-1 flex-col">
      <PublicHeader chapter={chapter} />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
        {children}
      </main>
      <PublicFooter chapter={chapter} />
    </div>
  );
}
