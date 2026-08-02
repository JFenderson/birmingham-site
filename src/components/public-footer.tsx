import Link from "next/link";
import type { CurrentChapter } from "@/lib/tenant/get-chapter";

const AFFILIATES = [
  { href: "https://phibetasigma1914.org/", label: "PBS - International Website" },
  { href: "https://www.pbssouthern.org/", label: "PBS - Premiere Southern Region" },
  { href: "https://alabamasigmas.org/index.html", label: "PBS - Premiere Alabama Sigmas" },
  { href: "https://www.birminghamal.gov/", label: "City of Birmingham" },
];

export function PublicFooter({ chapter }: { chapter: CurrentChapter }) {
  return (
    <footer id="contact" className="bg-[#0d1833] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 text-sm sm:px-8 lg:grid-cols-[1.2fr_1fr] lg:px-8">
        <div>
          <p className="max-w-xl leading-7 text-zinc-300">
            Tau Sigma is the Jefferson County, Birmingham, AL chapter of Phi Beta Sigma Fraternity, Inc. Established in 1924, this organization exemplifies the high ideals of brotherhood, scholarship, and service, serving as an asset to its community.
          </p>
        </div>

        <div>
          <p className="text-base font-semibold text-white">Affiliates</p>
          <ul className="mt-4 list-inside list-square space-y-2 text-zinc-200">
            {AFFILIATES.map((item) => (
              <li key={item.label}>
                <Link href={item.href} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-zinc-400 sm:px-8">
        © {new Date().getFullYear()} {chapter.name}. Culture For Service, Service For Humanity.
      </div>
    </footer>
  );
}
