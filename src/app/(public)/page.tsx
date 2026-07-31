import Link from "next/link";
import { ArrowRight, GraduationCap, HeartHandshake, Users } from "lucide-react";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";

const PILLARS = [
  {
    icon: Users,
    title: "Brotherhood",
    body: "The foundation of our chapter is built on lasting fellowship, mentorship, and the shared commitment to stand together in service and purpose.",
  },
  {
    icon: GraduationCap,
    title: "Scholarship",
    body: "We inspire excellence through academic growth, professional discipline, and the pursuit of wisdom that strengthens both our members and our community.",
  },
  {
    icon: HeartHandshake,
    title: "Service",
    body: "Culture for Service, Service for Humanity is more than a motto — it is the standard by which our chapter lives and serves.",
  },
];

const HIGHLIGHTS = [
  { title: "Founded", value: "1924" },
  { title: "Serving", value: "Birmingham & Jefferson County" },
  { title: "Mission", value: "Brotherhood, Scholarship & Service" },
];

export default async function Home() {
  const chapter = await getCurrentChapter();

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_24%),linear-gradient(135deg,_#0f1f4d_0%,_#18376b_40%,_#0c1634_100%)] px-6 py-24 text-white sm:py-28 lg:py-32">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_45%,rgba(255,255,255,0.05))]" aria-hidden />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium tracking-[0.22em] text-white/80 uppercase">
              <span className="h-2.5 w-2.5 rounded-full bg-white/90" />
              Phi Beta Sigma Fraternity, Inc.
            </div>
            <h1 className="mt-6 font-serif text-4xl italic leading-tight sm:text-5xl lg:text-6xl">
              {chapter.name}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/80 sm:text-xl">
              {chapter.type === "collegiate"
                ? "An advised collegiate chapter rooted in brotherhood, scholarship, and service."
                : "Chartered in 1924, our chapter proudly serves Birmingham and Jefferson County while carrying the legacy of Sigma excellence forward."}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-navy transition-transform hover:-translate-y-0.5 hover:bg-white/90"
              >
                Brothers Only Portal
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/#about"
                className="rounded-full border border-white/40 px-6 py-3 font-semibold text-white/90 transition-colors hover:bg-white/10"
              >
                Explore Our Mission
              </Link>
            </div>
          </div>

          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">
              Chapter Snapshot
            </p>
            <div className="mt-5 space-y-4">
              {HIGHLIGHTS.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
                    {item.title}
                  </p>
                  <p className="mt-1 text-base font-medium text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-navy/60">
              Our Legacy
            </p>
            <h2 className="mt-3 font-serif text-3xl italic text-navy sm:text-4xl">
              A chapter shaped by brotherhood, scholarship, and service.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-700">
              Chartered in 1924, Tau Sigma proudly serves Birmingham, Alabama and Jefferson County while remaining grounded in the ideals set forth by Phi Beta Sigma Fraternity, Inc. We are a chapter that places brotherhood first and service to our community above all.
            </p>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-700">
              As you browse our website, we hope you see the same commitment to excellence, leadership, and impact that has defined our chapter for generations.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full bg-navy/10 px-4 py-2 text-sm font-medium text-navy">
                Community Impact
              </span>
              <span className="rounded-full bg-navy/10 px-4 py-2 text-sm font-medium text-navy">
                Collegiate Mentorship
              </span>
              <span className="rounded-full bg-navy/10 px-4 py-2 text-sm font-medium text-navy">
                Scholarship Advancement
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-navy/60">
              President&apos;s Message
            </p>
            <p className="mt-4 text-lg leading-8 text-zinc-700">
              “On behalf of the men of the Tau Sigma Chapter, I welcome you to our digital home. Our work is rooted in serving others, uplifting our youth, and leaving a lasting legacy for generations to come.”
            </p>
            <div className="mt-8 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-navy/60">
                Chapter Focus
              </p>
              <p className="mt-2 text-base leading-7 text-zinc-700">
                From scholarship initiatives to service programs, the brothers of Tau Sigma remain committed to making a measurable difference in Birmingham and beyond.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-navy/60">
            What We Stand For
          </p>
          <h2 className="mt-3 font-serif text-3xl italic text-navy sm:text-4xl">
            Our founding principles remain at the center of everything we do.
          </h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy text-white">
                <Icon aria-hidden className="h-5 w-5" />
              </span>
              <h3 className="mt-6 font-serif text-2xl italic text-navy">{title}</h3>
              <p className="mt-3 text-base leading-7 text-zinc-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="join" className="bg-zinc-950 px-6 py-24 text-white">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 sm:p-10 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/60">
                Join The Brotherhood
              </p>
              <h2 className="mt-3 font-serif text-3xl italic sm:text-4xl">
                Interested in becoming a Sigma?
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">
                Whether you&apos;re a prospective member, a returning brother,
                or transferring from another chapter, we&apos;d love to hear
                from you.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">
                What to expect
              </p>
              <ul className="mt-4 space-y-3 text-base leading-7 text-white/80">
                <li>• A short application covering your background and interest.</li>
                <li>• Review by our Intake Director and chapter officers.</li>
                <li>• Personal follow-up to walk you through next steps.</li>
              </ul>
              <Link
                href="/join"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Start Your Application
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
