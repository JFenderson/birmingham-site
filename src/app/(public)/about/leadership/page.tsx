import Link from "next/link";
import { getSafeImageAlt, resolveLeadershipContent } from "@/lib/public-content";
import { getCurrentChapter } from "@/lib/tenant/get-chapter";
import { getSanityImageUrl } from "@/sanity/image-url";
import { getPublishedLeadershipPageLeaders } from "@/sanity/queries";
import type { SanityLeader } from "@/sanity/queries";

function LeaderCard({ leader }: { leader: SanityLeader }) {
  const portraitAlt = getSafeImageAlt(leader.portrait);
  const portraitUrl = leader.portrait && portraitAlt
    ? getSanityImageUrl(leader.portrait, 640, 800)
    : null;

  return (
    <article className="rounded-md border border-zinc-200 bg-[#f8f9fc] p-4">
      <div className="mb-4 flex h-32 w-full items-center justify-center overflow-hidden rounded-md bg-white">
        {portraitUrl && portraitAlt ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={portraitUrl}
          alt={portraitAlt}
          className="h-full w-full object-contain"
        />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/branding/tau-sigma.png"
            alt="Tau Sigma Chapter logo"
            className="h-full w-full object-contain p-5"
          />
        )}
      </div>
      <p className="font-semibold text-zinc-900">{leader.name}</p>
      <p className="text-sm text-zinc-600">{leader.role}</p>
      {leader.bio ? <p className="mt-3 text-sm leading-7 text-zinc-700">{leader.bio}</p> : null}
    </article>
  );
}

function expandLeadershipPlacements(leaders: SanityLeader[]): SanityLeader[] {
  return leaders.flatMap((leader) => {
    if (!leader.placements || leader.placements.length === 0) {
      return [{ ...leader, role: leader.role ?? "Leadership" }];
    }

    return leader.placements.map((placement, index) => ({
      ...leader,
      _id: `${leader._id}-${index}`,
      role: placement.role,
      section: placement.section,
      fraternityLevel: placement.fraternityLevel ?? null,
      order: placement.order,
    }));
  });
}

export default async function AboutLeadershipPage() {
  const chapter = await getCurrentChapter();
  const cmsLeaders = await getPublishedLeadershipPageLeaders(chapter.chapterSlug);
  const content = resolveLeadershipContent(cmsLeaders, {
    chapterName: chapter.name,
    chapterSlug: chapter.chapterSlug,
  });
  const displayLeaders = content.status === "populated"
    ? expandLeadershipPlacements(content.leaders)
    : [];

  return (
    <div className="bg-white px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-md border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
        <h1 className="text-4xl font-bold text-[#013594] sm:text-5xl">Leadership</h1>
        <p className="mt-4 text-[15px] leading-8 text-zinc-700">
          Tau Sigma leadership is committed to service-driven planning, chapter accountability, and member development.
        </p>

        {content.status === "empty" ? (
          <div className="mt-8 rounded-md border border-dashed border-zinc-300 bg-[#f8f9fc] p-6">
            <p className="text-sm leading-7 text-zinc-700">{content.message}</p>
          </div>
        ) : (
          <div className="mt-8 space-y-12">
            {([
              { key: "executiveBoard", title: "Executive Board" },
              { key: "committeeChairmen", title: "Committee Chairmen" },
            ] as const).map((section) => {
              const leaders = displayLeaders.filter(
                (leader) => (leader.section ?? "executiveBoard") === section.key,
              );
              if (leaders.length === 0) return null;

              return (
                <section key={section.key} aria-labelledby={`${section.key}-heading`}>
                  <h2 id={`${section.key}-heading`} className="text-2xl font-bold text-[#013594]">
                    {section.title}
                  </h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {leaders.map((leader) => <LeaderCard key={leader._id} leader={leader} />)}
                  </div>
                </section>
              );
            })}

            {(["state", "regional", "international"] as const).map((level) => {
              const leaders = displayLeaders.filter(
                (leader) => leader.section === "fraternityLeadership" && leader.fraternityLevel === level,
              );
              if (leaders.length === 0) return null;

              const title = `${level.charAt(0).toUpperCase()}${level.slice(1)}`;
              return (
                <section key={level} aria-labelledby={`fraternity-${level}-heading`}>
                  <h2 id={`fraternity-${level}-heading`} className="text-2xl font-bold text-[#013594]">
                    {title} Fraternity Leadership
                  </h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {leaders.map((leader) => <LeaderCard key={leader._id} leader={leader} />)}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <Link href="/about" className="mt-8 inline-flex rounded-full bg-[#0047AB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003b8e]">
          Back to About
        </Link>
      </div>
    </div>
  );
}
