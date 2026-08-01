import Link from "next/link";
import type { CurrentChapter } from "@/lib/tenant/get-chapter";

const QUICK_LINKS = [
  { href: "/#about", label: "Chapter History" },
  { href: "/#events", label: "Upcoming Events" },
];

export function PublicFooter({ chapter }: { chapter: CurrentChapter }) {
  return (
    <footer id="contact" className="bg-[#002254] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 text-sm sm:px-8 lg:grid-cols-[1.1fr_0.8fr_0.9fr] lg:px-8">
        <div>
          <p className="text-xl font-semibold text-white">{chapter.name}</p>
          <p className="mt-3 max-w-md leading-7 text-slate-300">
            Phi Beta Sigma Fraternity, Inc. <br />
            Chartered in 1924 <br />
            Birmingham, Alabama
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">Quick Links</p>
          <ul className="mt-4 space-y-2 text-slate-200">
            {QUICK_LINKS.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="transition-colors hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">Connect</p>
          <p className="mt-4 leading-7 text-slate-200">
            Follow the chapter for updates, service initiatives, and upcoming events across our community.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-slate-400 sm:px-8">
        © {new Date().getFullYear()} {chapter.name}. Culture For Service, Service For Humanity.
      </div>
    </footer>
  );
}
