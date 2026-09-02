import Link from "next/link";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";
import { getSignatureWeekend } from "@/sanity/queries";

export default async function BlueAndWhiteWeekendPage() {
  const cms = await getSignatureWeekend((await getCurrentChapter()).chapterSlug, "bhm-blue-and-white-weekend");
  return (
    <div className="bg-white px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-md border border-zinc-200 bg-[#f8f9fc] p-8 shadow-sm sm:p-10">
        <h1 className="text-4xl font-bold text-[#013594] sm:text-5xl">{cms?.title ?? "BHM Blue and White Weekend"}</h1>
        <p className="mt-4 text-[15px] leading-8 text-zinc-700">
          {cms?.overview ?? "This signature chapter weekend celebrates brotherhood, community engagement, and chapter legacy through coordinated events across Birmingham."}
        </p>
        {cms?.ticketUrl && <a href={cms.ticketUrl} className="mt-6 inline-flex rounded-full bg-[#0047AB] px-5 py-3 font-semibold text-white">{cms.ticketLabel ?? "Buy tickets"}</a>}
        {cms?.schedule?.length ? <div className="mt-8 space-y-4"><h2 className="text-2xl font-bold text-[#013594]">Weekend schedule</h2>{cms.schedule.map((item) => <article key={`${item.title}-${item.date}`} className="rounded-xl bg-white p-4"><h3 className="font-bold">{item.title}</h3><p className="text-sm text-zinc-600">{new Date(item.date).toLocaleString()}</p>{item.location && <p className="text-sm text-zinc-600">{item.location}</p>}{item.description && <p className="mt-2 text-sm text-zinc-700">{item.description}</p>}</article>)}</div> : null}
        <Link href="/community-events" className="mt-8 inline-flex rounded-full bg-[#0047AB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003b8e]">
          Back to Events
        </Link>
      </div>
    </div>
  );
}
