import Link from "next/link";
import { ChevronDown, GraduationCap, HeartHandshake, Users } from "lucide-react";
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
            href="/#principles"
            className="mt-10 inline-flex items-center gap-1 rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
          >
            Scroll Down
            <ChevronDown className="h-4 w-4" />
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

      <section id="about" className="bg-white px-6 py-16 sm:px-8 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <img
            src="https://lh3.googleusercontent.com/sitesv/AG8ngQX8OB2IKo0LT4dl92aBCrx3h2OqdBlL6nhNQWR_jWAJmDNvkCopyd_5M2f3sJXz2GwoW-Xf0fK9B70sJrfzxrwf3gHjOJrCN3PRZVL6pGpgCRSL2usLvBzVjQnhWsTB4c8fIKIlz4bamr8290pk-dOKUQL5o2UZ1k9SOgP6HG4OhLoEm3_93ek787-E0w_mXDlVQAcp-BQPyFvWNHAqjuQYlgNPSFkYAFlWxwJO=w1280"
            alt="Tau Sigma Chapter"
            className="w-full rounded-md object-cover shadow-sm"
          />
          <div>
            <h2 className="text-center text-3xl font-bold text-[#013594] sm:text-4xl">Tau Sigma Chapter</h2>
            <h3 className="mt-1 text-center text-3xl font-bold text-[#013594] sm:text-4xl">Birmingham Sigmas</h3>
            <div className="mt-6 space-y-4 text-[15px] leading-8 text-zinc-600">
              <p>
                Chartered in <strong className="text-zinc-900">1924</strong>, Tau Sigma proudly serves <strong className="text-zinc-900">Birmingham, AL and Jefferson County, AL Area</strong>. We are also the alumni advisor chapter to the Brothers of the Sigma Chapter of the Fraternity at Miles College, Eta Epsilon at the University of Alabama at Birmingham, Epsilon Tau at Talladega College, and Pi Kappa at Jacksonville State University.
              </p>
              <p>
                We are a chapter that places <strong className="text-zinc-900">BROTHERHOOD</strong> first and <strong className="text-zinc-900">SERVICE</strong> to our community above all. As you browse through our website, we hope you see us as a reflection of our Fraternity&apos;s motto, “Culture for Service and Service for Humanity.”
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="events" className="bg-[#f8f9fc] px-6 py-16 sm:px-8 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.55fr_1.45fr] lg:items-start">
          <div>
            <img
              src="https://lh3.googleusercontent.com/sitesv/AG8ngQWsiyjTFdYEOWsWDvLtCK_dOaDLIKOo580jj6HKsurMo7pIPbWBjyKGOJD8FOTgJkGpRjefJ9GFRUYcAKFrLqezvO3xERsEJzIVMTwWmXW-9icWLkGGY8UWQufMDwqD8T5Dy9P3jPs6rtDBpee5ykr9qu4g-6Qm4AFCPf_73k_TwStF82qO4yHXHz0QzoIkl49T51KSfDmMpeFenI8cI_M3dKD80E9kddsZOTYK=w1280"
              alt="Chapter President"
              className="mx-auto w-full max-w-sm rounded-md object-cover shadow-sm"
            />
            <div className="mt-4 text-center">
              <p className="font-semibold text-[#013594]">Bro. Joseph Fenderson</p>
              <p className="text-sm text-zinc-700">Chapter President</p>
              <p className="text-sm text-zinc-700">Alabama 1st Vice Director</p>
            </div>
          </div>

          <article className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-center text-3xl font-bold text-[#013594] sm:text-4xl">President&apos;s Message</h2>
            <div className="mt-6 space-y-4 text-[15px] leading-8 text-zinc-700">
              <p>Greetings Brothers, Guests, and Friends,</p>
              <p>
                On behalf of the men of the Tau Sigma Chapter of Phi Beta Sigma Fraternity, Inc., I welcome you to our digital home.
              </p>
              <p>
                Founded on the principles of <strong className="text-[#013594]">Brotherhood, Scholarship, and Service</strong>, our chapter continues to stand as a beacon of leadership, community engagement, and fraternal excellence here in Birmingham, Alabama.
              </p>
              <p>
                From our <strong>Shoes for Kids</strong> and <strong>Toys for Kids</strong> initiatives to annual scholarship awards for deserving seniors, we are intentional about leaving a legacy of impact.
              </p>
              <p>
                As you explore our site, we hope you learn more about the work we are doing and how you can support our efforts or become a part of the Sigma Brotherhood.
              </p>
            </div>
          </article>
          </div>
      </section>
    </>
  );
}
