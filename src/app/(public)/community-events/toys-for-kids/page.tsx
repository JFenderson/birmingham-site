import Link from "next/link";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";
import { getCommunityInitiative } from "@/sanity/queries";

export default async function ToysForKidsPage() {
  const cms = await getCommunityInitiative((await getCurrentChapter()).chapterSlug, "toys-for-kids");
  return (
    <div className="bg-white px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-md border border-zinc-200 bg-[#f8f9fc] p-8 shadow-sm sm:p-10">
        <h1 className="text-4xl font-bold text-[#013594] sm:text-5xl">{cms?.title ?? "Toys for Kids"}</h1>
        <p className="mt-4 text-[15px] leading-8 text-zinc-700">
          {cms?.body ?? "Toys for Kids is our seasonal holiday outreach focused on giving children joyful support and practical resources."}
        </p>
        <Link href="/community-events" className="mt-8 inline-flex rounded-full bg-[#0047AB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003b8e]">
          Back to Events
        </Link>
      </div>
    </div>
  );
}
