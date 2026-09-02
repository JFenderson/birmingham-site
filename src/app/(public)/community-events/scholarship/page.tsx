import Link from "next/link";
import { ScholarshipApplicationForm } from "./application-form";
import { isScholarshipOpen } from "@/lib/scholarship/application";

export default function ScholarshipPage() {
  return (
    <div className="bg-white px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-md border border-zinc-200 bg-[#f8f9fc] p-8 shadow-sm sm:p-10">
        <h1 className="text-4xl font-bold text-[#013594] sm:text-5xl">Scholarship</h1>
        <p className="mt-4 text-[15px] leading-8 text-zinc-700">
          Tau Sigma scholarship efforts recognize local students for academic achievement, leadership, and community involvement.
        </p>
        <div className="mt-8 border-t border-zinc-200 pt-8"><h2 className="text-2xl font-bold text-[#013594]">Apply for the Tau Sigma Sapphire Scholarship</h2><p className="mt-2 text-zinc-700">Applications are accepted October 1 through February 28 (February 29 in leap years).</p>{isScholarshipOpen() ? <ScholarshipApplicationForm /> : <p className="mt-4 rounded-lg bg-zinc-100 p-4">Applications are currently closed. Please return October 1.</p>}</div>
        <Link href="/community-events" className="mt-8 inline-flex rounded-full bg-[#0047AB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003b8e]">
          Back to Events
        </Link>
      </div>
    </div>
  );
}
