import Link from "next/link";
import type { CurrentChapter } from "@/lib/tenant/get-chapter";

const AFFILIATES = [
  { href: "https://phibetasigma1914.org/", label: "Phi Beta Sigma International" },
  { href: "https://www.pbssouthern.org/", label: "Premiere Southern Region" },
  { href: "https://alabamasigmas.org/index.html", label: "Premiere Alabama Sigmas" },
  { href: "https://www.birminghamal.gov/", label: "City of Birmingham" },
];

export function PublicFooter({ chapter }: { chapter: CurrentChapter }) {
  return (
    <footer id="contact" className="border-t border-white/10 bg-navy-dark text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 text-sm md:grid-cols-[1.1fr_0.8fr_0.8fr]">
        <div>
          <p className="font-serif text-xl italic text-white">{chapter.name}</p>
          <p className="mt-3 max-w-md leading-7 text-white/70">
            {chapter.type === "collegiate"
              ? "An advised collegiate chapter of Phi Beta Sigma Fraternity, Inc."
              : "Serving Birmingham and Jefferson County with a focus on brotherhood, scholarship, and service."}
          </p>
        </div>

        <div>
          <p className="font-semibold uppercase tracking-[0.28em] text-white">Founding Principles</p>
          <ul className="mt-4 space-y-2 text-white/70">
            <li>Brotherhood</li>
            <li>Scholarship</li>
            <li>Service</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold uppercase tracking-[0.28em] text-white">Affiliates</p>
          <ul className="mt-4 space-y-2">
            {AFFILIATES.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/70 transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {chapter.name}. Culture For Service, Service For Humanity.
      </div>
    </footer>
  );
}
