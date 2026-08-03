import Link from "next/link";

const COMMUNITY_EVENTS = [
  {
    href: "/community-events/bhm-blue-and-white-weekend",
    title: "BHM Blue and White Weekend",
    body: "A signature chapter gathering that celebrates fellowship, legacy, and service in the Birmingham community.",
  },
  {
    href: "/community-events/shoes-for-kids",
    title: "Shoes for Kids",
    body: "Annual outreach focused on helping students start the school year with confidence and support.",
  },
  {
    href: "/community-events/toys-for-kids",
    title: "Toys for Kids",
    body: "Holiday initiative that partners with local families and organizations to deliver joy and resources.",
  },
  {
    href: "/community-events/scholarship",
    title: "Scholarship",
    body: "Scholarship support for graduating seniors, recognizing academic excellence and leadership potential.",
  },
];

export default function CommunityEventsPage() {
  return (
    <div className="bg-white px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-center text-4xl font-bold text-[#013594] sm:text-5xl">Community Events</h1>
        <p className="mx-auto mt-4 max-w-3xl text-center text-[15px] leading-8 text-zinc-600">
          Learn more about our signature outreach programs and year-round service commitments.
        </p>

        <div className="mt-10 space-y-6">
          {COMMUNITY_EVENTS.map((event) => (
            <Link
              key={event.href}
              href={event.href}
              className="block rounded-md border border-zinc-200 bg-[#f8f9fc] p-6 shadow-sm transition-transform hover:-translate-y-0.5 sm:p-8"
            >
              <h2 className="text-2xl font-bold text-[#013594]">{event.title}</h2>
              <p className="mt-3 text-[15px] leading-8 text-zinc-700">{event.body}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
