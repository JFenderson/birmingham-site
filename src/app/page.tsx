import Link from "next/link";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const { chapterId, chapterSlug } = await getTenantContext();
  const supabase = await createClient();
  const { data: chapter } = await supabase
    .from("chapters")
    .select("name, type")
    .eq("id", chapterId)
    .maybeSingle();

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-6 py-32 px-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          {chapter?.name ?? chapterSlug}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {chapter?.type === "collegiate"
            ? "Advised collegiate chapter"
            : "Tau Sigma Graduate Chapter"}
        </p>
        <Link
          href="/login"
          className="rounded-full bg-foreground px-6 py-3 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Brothers Only Portal
        </Link>
      </main>
    </div>
  );
}
