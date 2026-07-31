import Link from "next/link";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";

export default async function Home() {
  const chapter = await getCurrentChapter();

  return (
    <>
      <section className="relative flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-navy to-navy-dark px-6 py-28 text-center text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
          Phi Beta Sigma Fraternity, Inc.
        </p>
        <h1 className="max-w-3xl text-4xl font-extrabold uppercase italic tracking-tight sm:text-6xl">
          {chapter.name}
        </h1>
        <p className="max-w-xl text-white/70">
          {chapter.type === "collegiate"
            ? "An advised collegiate chapter"
            : "Serving Birmingham and Jefferson County since 1924"}
        </p>
        <Link
          href="/login"
          className="mt-2 rounded-full bg-white px-6 py-3 font-semibold text-navy transition-colors hover:bg-white/90"
        >
          Brothers Only Portal
        </Link>
      </section>

      <section id="about" className="mx-auto grid max-w-5xl gap-10 px-6 py-20 sm:grid-cols-3">
        <div>
          <h2 className="text-lg font-bold text-navy">Brotherhood</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Phi Beta Sigma was founded on January 9, 1914, by three young
            African-American male students. Our chapter represents an
            extension of that real Brotherhood — one that calls for and
            gladly gives its best in the hour of need.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-navy">Scholarship</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            We leverage knowledge acquired through academic, military, and
            professional accomplishment to encourage the development of
            keen perception and sound judgement in our youth.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-navy">Service</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Culture For Service, Service For Humanity — our chapter serves as
            a mechanism to deliver service to the communities we call home.
          </p>
        </div>
      </section>

      <section id="join" className="bg-zinc-50 px-6 py-20 text-center dark:bg-zinc-950">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-bold text-navy">
            Interested in Becoming a Sigma?
          </h2>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Intake, reactivation, and transfer applications are coming soon
            to this site. In the meantime, reach out through our chapter
            officers to learn more.
          </p>
        </div>
      </section>
    </>
  );
}
