import Link from "next/link";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";
import { getPublishedPrograms } from "@/sanity/queries";

export default async function AboutProgramsPage() {
  const { chapterSlug } = await getCurrentChapter();
  const programs = await getPublishedPrograms(chapterSlug);

  return (
    <div className="bg-white px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto max-w-8xl rounded-md border border-zinc-200 bg-[#f8f9fc] p-8 shadow-sm sm:p-10 lg:p-12">
        <h1 className="text-4xl font-bold text-[#013594] sm:text-5xl">Programs</h1>
        {programs.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {programs.map((program) => (
              <article key={program._id} className="rounded-md border border-zinc-200 bg-white p-7">
                <h2 className="text-xl font-semibold text-[#013594]">{program.title}</h2>
                <p className="mt-2 text-[15px] leading-7 text-zinc-700">{program.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <>
            <p className="mt-4 text-[15px] leading-8 text-zinc-700">
              Tau Sigma&apos;s programs focus on brotherhood, scholarship, and service. Core efforts include youth support,
              community outreach, educational advancement, and partnerships that strengthen Birmingham and Jefferson County.
            </p>
            <p className="mt-4 text-[15px] leading-8 text-zinc-700">
              Program details, volunteer opportunities, and event schedules are shared through chapter announcements and public updates.
            </p>
          </>
        )}

        <Link href="/about" className="mt-8 inline-flex rounded-full bg-[#0047AB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003b8e]">
          Back to About
        </Link>
      </div>
    </div>
  );
}
