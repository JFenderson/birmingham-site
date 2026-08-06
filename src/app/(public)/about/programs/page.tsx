import Link from "next/link";

export default function AboutProgramsPage() {
  return (
    <div className="bg-white px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-md border border-zinc-200 bg-[#f8f9fc] p-8 shadow-sm sm:p-10">
        <h1 className="text-4xl font-bold text-[#013594] sm:text-5xl">Programs</h1>
        <p className="mt-4 text-[15px] leading-8 text-zinc-700">
          Tau Sigma&apos;s programs focus on brotherhood, scholarship, and service. Core efforts include youth support,
          community outreach, educational advancement, and partnerships that strengthen Birmingham and Jefferson County.
        </p>
        <p className="mt-4 text-[15px] leading-8 text-zinc-700">
          Program details, volunteer opportunities, and event schedules are shared through chapter announcements and public updates.
        </p>

        <Link href="/about" className="mt-8 inline-flex rounded-full bg-[#0047AB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003b8e]">
          Back to About
        </Link>
      </div>
    </div>
  );
}
