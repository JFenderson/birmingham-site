import Link from "next/link";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";

const ABOUT_PAGES = [
  {
    href: "/about/programs",
    title: "Programs",
    body: "Explore chapter initiatives focused on service, scholarship, and community development.",
  },
  {
    href: "/about/leadership",
    title: "Leadership",
    body: "Meet the brothers leading Tau Sigma and supporting chapter operations.",
  },
  {
    href: "/about/past-presidents",
    title: "Past Presidents",
    body: "Review leadership legacy and historic chapter stewardship.",
  },
  {
    href: "/about/active-roster",
    title: "Active Roster",
    body: "Find member-access details for current roster information.",
  },
  {
    href: "/sigma-beta-club",
    title: "Sigma Beta Club",
    body: "Discover our mentoring program for young men, including events and how to get involved.",
  },
  {
    href: "/foundation",
    title: "Foundation",
    body: "Learn about the Tau Sigma Charity Foundation, our community projects, and how to support our mission.",
  },
];

export default async function AboutPage() {
  const chapter = await getCurrentChapter();

  return (
    <div className="bg-white px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <section>
          <h1 className="text-center text-4xl font-bold text-[#013594] sm:text-5xl">About {chapter.name}</h1>
          <p className="mx-auto mt-5 max-w-3xl text-center text-[15px] leading-8 text-zinc-600">
            Chartered in 1924, Tau Sigma proudly serves Birmingham, Alabama and the Jefferson County area.
            We are an alumni advisor chapter to Sigma Chapter at Miles College, Eta Epsilon at UAB,
            Epsilon Tau at Talladega College, and Pi Kappa at Jacksonville State University.
          </p>
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          {ABOUT_PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <h2 className="text-2xl font-bold text-[#013594]">{page.title}</h2>
              <p className="mt-3 text-[15px] leading-8 text-zinc-700">{page.body}</p>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
