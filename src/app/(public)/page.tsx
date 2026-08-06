import Link from "next/link";
import { ArrowRight, GraduationCap, HeartHandshake, Users } from "lucide-react";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";

const PILLARS = [
  {
    icon: Users,
    title: "Brotherhood",
    body: "A lifelong community of men committed to fellowship, support, and uplifting one another through every season of life.",
  },
  {
    icon: GraduationCap,
    title: "Scholarship",
    body: "A tradition of academic excellence, leadership, and disciplined growth that strengthens our members and our community.",
  },
  {
    icon: HeartHandshake,
    title: "Service",
    body: "A mission rooted in service, impact, and giving back through meaningful programs and outreach across Birmingham.",
  },
];

export default async function Home() {
  const chapter = await getCurrentChapter();

  return (
    <>
      <section className="relative isolate flex min-h-[75vh] items-center justify-center overflow-hidden bg-slate-900 px-6 py-24 text-white sm:px-8 lg:px-12">
        <div
          className="absolute inset-0 bg-[url('https://lh3.googleusercontent.com/sitesv/AG8ngQV3ez2rl1IdOOrj46RkLfDFJx3vTG_7w51vD_7mn9UNWX_LDDdP03xd9koxCqPxlXnXIPAMcEfgeBZx7YBrvDvhjb-66p4UwXNQ2HcSGYeJOEUuGH8Bcg0JGQyTL7DQ4f73SWWbPedQDELnLMhulH8q8YBpBeBrOwTfPlFhkSxcLdrPfeMGR0LIHykh9Kw=w16383')] bg-cover bg-center"
          aria-hidden
        />
        <div className="absolute inset-0 bg-black/55" aria-hidden />
        <div className="relative mx-auto w-full max-w-5xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/80">
            Phi Beta Sigma Fraternity, Inc.
          </p>
          <h1 className="mt-6 text-4xl font-black uppercase tracking-[0.2em] text-white sm:text-5xl lg:text-6xl">
            Culture For Service
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">
            Service For Humanity. Welcome to the official website of the {chapter.name} of Phi Beta Sigma Fraternity, Inc.
          </p>
          <Link
            href="/about"
            className="mt-10 inline-flex items-center gap-1 rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
          >
            Explore Site
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section id="principles" className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-md border border-zinc-200 bg-white px-5 py-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-xl font-semibold text-[#013594]">
                <Icon aria-hidden className="h-5 w-5" />
                {title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-zinc-600">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#f8f9fc] px-6 py-16 sm:px-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold text-[#013594] sm:text-4xl">Explore Tau Sigma</h2>
          <p className="mx-auto mt-4 max-w-3xl text-center text-[15px] leading-8 text-zinc-600">
            Dive deeper into our chapter history, photo gallery, community programs, and ways to connect.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/about"
              className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <p className="text-lg font-semibold text-[#013594]">About</p>
              <p className="mt-2 text-sm leading-7 text-zinc-600">Learn our legacy, mission, and chapter leadership.</p>
            </Link>

            <Link
              href="/photos"
              className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <p className="text-lg font-semibold text-[#013594]">Photos</p>
              <p className="mt-2 text-sm leading-7 text-zinc-600">View moments from service and brotherhood events.</p>
            </Link>

            <Link
              href="/community-events"
              className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <p className="text-lg font-semibold text-[#013594]">Community Events</p>
              <p className="mt-2 text-sm leading-7 text-zinc-600">See our flagship initiatives and community impact.</p>
            </Link>

            <Link
              href="/contact"
              className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <p className="text-lg font-semibold text-[#013594]">Contact</p>
              <p className="mt-2 text-sm leading-7 text-zinc-600">Reach out for questions, support, or partnership.</p>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
