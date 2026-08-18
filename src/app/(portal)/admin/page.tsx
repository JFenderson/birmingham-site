import Link from "next/link";

const adminAreas = [
  {
    title: "Member management",
    description: "Review approvals, membership status, and administrator access.",
    href: "/admin/members",
    action: "Manage members",
  },
  {
    title: "Events",
    description: "Plan chapter events and review attendance activity.",
    href: "/events",
    action: "Open events",
  },
  {
    title: "Content",
    description: "Manage public chapter content, programs, leadership, and events in Sanity Studio.",
    href: "/studio",
    action: "Open Sanity Studio",
  },
  {
    title: "News",
    description: "Publish chapter announcements and news updates without changing code.",
    href: "/studio/desk/post",
    action: "Manage news",
  },
  {
    title: "Photos",
    description: "Manage chapter media and cover images from the Sanity workspace.",
    href: "/studio",
    action: "Open media workspace",
  },
  {
    title: "Settings",
    description: "Configure chapter-level administration settings.",
  },
] as const;

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Administration overview</h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Use the available tools below to manage chapter operations. Public content is managed in Sanity Studio.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adminAreas.map((area) => (
          <article
            key={area.title}
            className="flex min-h-48 flex-col rounded-md border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h3 className="text-lg font-semibold">{area.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {area.description}
            </p>
            {"href" in area ? (
              <Link
                href={area.href}
                className="mt-5 inline-flex w-fit rounded-md bg-navy px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark"
              >
                {area.action}
              </Link>
            ) : (
              <span className="mt-5 w-fit rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                Planned
              </span>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
