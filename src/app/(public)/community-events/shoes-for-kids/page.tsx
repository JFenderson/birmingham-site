import Link from "next/link";

export default function ShoesForKidsPage() {
  return (
    <div className="bg-white px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-md border border-zinc-200 bg-[#f8f9fc] p-8 shadow-sm sm:p-10">
        <h1 className="text-4xl font-bold text-[#013594] sm:text-5xl">Shoes for Kids</h1>
        <p className="mt-4 text-[15px] leading-8 text-zinc-700">
          Shoes for Kids supports students and families by providing back-to-school essentials, helping children begin the year with confidence.
        </p>
        <Link href="/community-events" className="mt-8 inline-flex rounded-full bg-[#0047AB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003b8e]">
          Back to Events
        </Link>
      </div>
    </div>
  );
}
