import Link from "next/link";
import { notFound } from "next/navigation";
import { RequestAccessForm } from "./request-access-form";
import { ROOT_SLUG } from "@/lib/tenant/constants";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";

export default async function RequestAccessPage() {
  const chapter = await getCurrentChapter();
  if (chapter.chapterSlug !== ROOT_SLUG) notFound();

  return (
    <div className="bg-[#f8f9fc] px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#0047AB]">
            Tau Sigma members
          </p>
          <h1 className="mt-3 text-4xl font-bold text-[#013594] sm:text-5xl">
            Request Member Access
          </h1>
          <p className="mt-5 text-[15px] leading-8 text-zinc-700">
            Current Tau Sigma brothers can request access to the secure member
            portal. If the details match the chapter roster, an email will walk
            you through setting up your account.
          </p>
          <p className="mt-5 text-sm leading-7 text-zinc-600">
            This request does not approve portal access automatically. An
            administrator still reviews pending member profiles before internal
            pages unlock.
          </p>
          <Link
            href="/login"
            className="mt-7 inline-flex rounded-full border border-[#0047AB] px-4 py-2 text-sm font-semibold text-[#0047AB] transition-colors hover:bg-[#0047AB] hover:text-white"
          >
            Already have an account?
          </Link>
        </div>

        <section className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-zinc-950">
            Member verification
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Enter your membership number, last name, full name, and preferred
            email address.
          </p>
          <div className="mt-7">
            <RequestAccessForm />
          </div>
        </section>
      </div>
    </div>
  );
}
