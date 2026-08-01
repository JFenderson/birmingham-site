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
  await getCurrentChapter();

  return (
    <>
      <section className="relative isolate flex min-h-[560px] items-center overflow-hidden bg-slate-900 px-6 py-24 text-white sm:px-8 lg:px-12">
        <div
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center"
          aria-hidden
        />
        <div className="absolute inset-0 bg-black/60" aria-hidden />
        <div className="relative mx-auto w-full max-w-7xl text-center lg:text-left">
          <div className="mx-auto max-w-3xl lg:mx-0">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/80">
              Phi Beta Sigma Fraternity, Inc.
            </p>
            <h1 className="mt-6 text-4xl font-black uppercase tracking-[0.25em] text-white sm:text-5xl lg:text-6xl">
              Culture For Service
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-200 lg:mx-0">
              Service For Humanity. Welcome to the official website of the Tau Sigma Chapter of Phi Beta Sigma Fraternity, Inc.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
              <Link
                href="/#about"
                className="inline-flex items-center rounded-full bg-[#0047AB] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-[#003b8e]"
              >
                Learn More About Us
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-8 lg:py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#0047AB] sm:text-4xl">
            Welcome to Birmingham Sigmas
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-700">
            We are dedicated to the enduring principles of Brotherhood, Scholarship, and Service. Our chapter continues to serve Birmingham, Alabama with excellence, integrity, and purpose.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0047AB] text-white">
                <Icon aria-hidden className="h-5 w-5" />
              </span>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">{title}</h3>
              <p className="mt-3 text-base leading-7 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="events" className="border-t border-slate-200 bg-slate-50 px-6 py-20 sm:px-8 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#0047AB]">
                Chapter Highlights
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                Programs, community initiatives, and signature events.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
                From scholarship programming to service efforts and major chapter events, Tau Sigma remains active in creating lasting impact across Birmingham.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-600">
                Featured Areas
              </p>
              <ul className="mt-4 space-y-3 text-base leading-7 text-slate-700">
                <li>• BHM Blue and White Weekend</li>
                <li>• Shoes for Kids</li>
                <li>• Toys for Kids</li>
                <li>• Scholarship Programs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
