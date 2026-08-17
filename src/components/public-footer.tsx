import Link from "next/link";
import { ArrowUpRight, CalendarDays, Mail } from "lucide-react";
import type { CurrentChapter } from "@/lib/tenant/get-chapter";

const AFFILIATES = [
  { href: "https://phibetasigma1914.org/", label: "PBS - International Website" },
  { href: "https://www.pbssouthern.org/", label: "PBS - Premiere Southern Region" },
  { href: "https://alabamasigmas.org/index.html", label: "PBS - Premiere Alabama Sigmas" },
  { href: "https://www.birminghamal.gov/", label: "City of Birmingham" },
];

const NAVIGATION_GROUPS = [
  {
    title: "Explore",
    links: [
      { href: "/about", label: "About Tau Sigma" },
      { href: "/about/programs", label: "Programs" },
      { href: "/about/leadership", label: "Leadership" },
      { href: "/news", label: "Chapter News" },
    ],
  },
  {
    title: "Get involved",
    links: [
      { href: "/community-events", label: "Community Events" },
      { href: "/photos", label: "Chapter Photos" },
      { href: "/contact", label: "Contact Us" },
      { href: "/login", label: "Member Login" },
    ],
  },
];

export function PublicFooter({ chapter }: { chapter: CurrentChapter }) {
  return (
    <footer id="contact" className="bg-[#071b3a] text-white">
      <div className="mx-auto grid max-w-[var(--public-content-max)] gap-10 px-[var(--public-gutter)] py-12 text-sm lg:grid-cols-[1.3fr_0.75fr_0.9fr_1fr] lg:py-16">
        <div>
          <p className="font-[family-name:var(--public-font-display)] text-lg font-bold tracking-tight text-white">
            {chapter.name}
          </p>
          <p className="mt-4 max-w-sm leading-7 text-blue-100/80">
            {chapter.siteType === "collegiate"
              ? "A collegiate chapter of Phi Beta Sigma Fraternity, Inc. advancing brotherhood, scholarship, and service."
              : "A graduate chapter of Phi Beta Sigma Fraternity, Inc. committed to building stronger communities across Birmingham and Jefferson County."}
          </p>
          <p className="mt-5 text-sm font-semibold tracking-wide text-white">
            Culture For Service, Service For Humanity.
          </p>
        </div>

        {NAVIGATION_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-white">{group.title}</p>
            <ul className="mt-4 space-y-3 text-blue-100/80">
              {group.links.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition-colors hover:text-white">
                    {item.href === "/about" ? `About ${chapter.name}` : item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="space-y-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-white">Affiliates</p>
            <ul className="mt-4 space-y-3 text-blue-100/80">
              {AFFILIATES.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 transition-colors hover:text-white"
                  >
                    {item.label}
                    <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-white">Stay connected</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-[var(--public-blue-deep)]"
              >
                <Mail aria-hidden="true" className="h-4 w-4" />
                Contact
              </Link>
              <Link
                href="/community-events"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-[var(--public-blue-deep)]"
              >
                <CalendarDays aria-hidden="true" className="h-4 w-4" />
                Community events
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-[var(--public-gutter)] py-5 text-center text-xs text-blue-100/70">
        © {new Date().getFullYear()} {chapter.name}. All rights reserved.
      </div>
    </footer>
  );
}
