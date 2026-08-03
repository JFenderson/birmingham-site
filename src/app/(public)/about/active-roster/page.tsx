import Link from "next/link";

const ROSTER_NOTES = [
  "Active roster details are available to members through the secure portal.",
  "If you are a member, sign in to view complete chapter records.",
];

export default function AboutActiveRosterPage() {
  return (
    <div className="bg-white px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-md border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
        <h1 className="text-4xl font-bold text-[#013594] sm:text-5xl">Active Roster</h1>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-[15px] leading-8 text-zinc-700">
          {ROSTER_NOTES.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>

        <div className="mt-8 flex gap-3">
          <Link href="/about" className="inline-flex rounded-full bg-[#0047AB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003b8e]">
            Back to About
          </Link>
          <Link href="/login" className="inline-flex rounded-full border border-[#0047AB] px-4 py-2 text-sm font-semibold text-[#0047AB] hover:bg-[#0047AB] hover:text-white">
            Brother Login
          </Link>
        </div>
      </div>
    </div>
  );
}
