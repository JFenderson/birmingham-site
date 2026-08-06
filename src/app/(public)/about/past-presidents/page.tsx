import Link from "next/link";

const NOTES = [
  "Historical chapter records are being digitized for this section.",
  "Please check back soon for a full list of past chapter presidents.",
];

export default function AboutPastPresidentsPage() {
  return (
    <div className="bg-white px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-md border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
        <h1 className="text-4xl font-bold text-[#013594] sm:text-5xl">Past Presidents</h1>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-[15px] leading-8 text-zinc-700">
          {NOTES.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>

        <Link href="/about" className="mt-8 inline-flex rounded-full bg-[#0047AB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003b8e]">
          Back to About
        </Link>
      </div>
    </div>
  );
}
