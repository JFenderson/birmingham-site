import Link from "next/link";
import type { CurrentChapter } from "@/lib/tenant/get-chapter";

const NAV_LINKS = [
  { href: "/#about", label: "About" },
  { href: "/#join", label: "Join" },
  { href: "/#contact", label: "Contact" },
];

export function PublicHeader({ chapter }: { chapter: CurrentChapter }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-navy/95 text-white shadow-md shadow-black/10 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2 font-serif font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-sm italic">
            ΤΣ
          </span>
          <span className="hidden text-sm sm:inline italic">{chapter.name}</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 text-sm font-medium text-white/85 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative py-1 transition-colors hover:text-white after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:content-[''] hover:after:scale-x-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/login"
          className="ml-auto rounded-full border border-white/70 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-white hover:text-navy sm:ml-0"
        >
          Brothers Only
        </Link>
      </div>
    </header>
  );
}
