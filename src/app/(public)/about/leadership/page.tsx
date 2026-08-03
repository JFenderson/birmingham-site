import Link from "next/link";

const LEADERSHIP = [
  { name: "Bro. Joseph Fenderson", role: "Chapter President" },
  { name: "Tau Sigma Executive Board", role: "Chapter Leadership Team" },
];

export default function AboutLeadershipPage() {
  return (
    <div className="bg-white px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-md border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
        <h1 className="text-4xl font-bold text-[#013594] sm:text-5xl">Leadership</h1>
        <p className="mt-4 text-[15px] leading-8 text-zinc-700">
          Tau Sigma leadership is committed to service-driven planning, chapter accountability, and member development.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {LEADERSHIP.map((leader) => (
            <article key={leader.name} className="rounded-md border border-zinc-200 bg-[#f8f9fc] p-4">
              <p className="font-semibold text-zinc-900">{leader.name}</p>
              <p className="text-sm text-zinc-600">{leader.role}</p>
            </article>
          ))}
        </div>

        <Link href="/about" className="mt-8 inline-flex rounded-full bg-[#0047AB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003b8e]">
          Back to About
        </Link>
      </div>
    </div>
  );
}
