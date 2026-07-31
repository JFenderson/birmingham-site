import Link from "next/link";
import type { CurrentChapter } from "@/lib/tenant/get-chapter";

const NAV_LINKS = [
  { href: "/#about", label: "About" },
  { href: "/#join", label: "Join" },
  { href: "/#contact", label: "Contact" },
];

export function PublicHeader({ chapter }: { chapter: CurrentChapter }) {
  return (
    <header className="sticky top-0 z-10 bg-navy text-white">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-sm">
            ΤΣ
          </span>
          <span className="hidden sm:inline">{chapter.name}</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 text-sm font-medium text-white/85 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white">
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
