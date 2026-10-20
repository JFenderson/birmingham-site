import Link from "next/link";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";
import { getPublishedEvents } from "@/sanity/queries";
import { getSanityImageUrl } from "@/sanity/image-url";

const COMMUNITY_EVENTS = [
  {
    href: "/community-events/bhm-blue-and-white-weekend",
    title: "BHM Blue and White Weekend",
    description: "A signature chapter gathering that celebrates fellowship, legacy, and service in the Birmingham community.",
  },
  {
    href: "/shoes-for-kids",
    title: "Shoes for Kids",
    description: "Annual outreach focused on helping students start the school year with confidence and support.",
  },
  {
    href: "/community-events/toys-for-kids",
    title: "Toys for Kids",
    description: "Holiday initiative that partners with local families and organizations to deliver joy and resources.",
  },
  {
    href: "/community-events/scholarship",
    title: "Scholarship",
    description: "Scholarship support for graduating seniors, recognizing academic excellence and leadership potential.",
  },
];

export default async function CommunityEventsPage() {
  const { chapterSlug } = await getCurrentChapter();
  const cmsEvents = await getPublishedEvents(chapterSlug);
  const events = cmsEvents.length > 0 ? cmsEvents : COMMUNITY_EVENTS;

  return (
    <div className="bg-white px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-center text-4xl font-bold text-[#013594] sm:text-5xl">Community Events</h1>
        <p className="mx-auto mt-4 max-w-3xl text-center text-[15px] leading-8 text-zinc-600">
          Learn more about our signature outreach programs and year-round service commitments.
        </p>

        <div className="mt-10 space-y-6">
          {events.map((event) => {
            const image = "_id" in event ? event.image : null;
            const imageAlt = image?.alt?.trim();
            const imageUrl = image && imageAlt ? getSanityImageUrl(image, 640, 880, "max") : null;
            const fullImageUrl = image && imageAlt ? getSanityImageUrl(image, 1600, 2200, "max") : null;
            const className =
              "block rounded-md border border-zinc-200 bg-[#f8f9fc] p-6 shadow-sm transition-transform hover:-translate-y-0.5 sm:p-8";
            const content = (
              <div className={imageUrl ? "grid gap-6 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-center" : undefined}>
                {imageUrl && imageAlt ? (
                  <a href={fullImageUrl ?? imageUrl} target="_blank" rel="noopener noreferrer" className="group block text-center">
                    {/* Preserve the whole flyer, including text near its edges. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt={imageAlt} loading="lazy" decoding="async" className="mx-auto max-h-80 w-auto max-w-full rounded-md object-contain shadow-sm" />
                    <span className="mt-3 inline-block text-sm font-semibold text-[#013594] underline-offset-2 group-hover:underline">View image full size</span>
                  </a>
                ) : null}
                <div>
                  <h2 className="text-2xl font-bold text-[#013594]">{event.title}</h2>
                  <p className="mt-3 text-[15px] leading-8 text-zinc-700">{event.description}</p>
                </div>
              </div>
            );

            return "href" in event ? (
              <Link key={event.href} href={event.href} className={className}>
                {content}
              </Link>
            ) : (
              <article key={event._id} className={className}>
                {content}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
