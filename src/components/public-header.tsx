"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import type { CurrentChapter } from "@/lib/tenant/get-chapter";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  {
    href: "/about",
    label: "About",
    children: [
      { href: "/about/programs", label: "Programs" },
      { href: "/about/leadership", label: "Leadership" },
      { href: "/about/past-presidents", label: "Past Presidents" },
      { href: "/about/active-roster", label: "Active Roster" },
    ],
  },
  { href: "/photos", label: "Photos" },
  { href: "/news", label: "News" },
  {
    href: "/community-events",
    label: "Events",
    children: [
      { href: "/community-events/bhm-blue-and-white-weekend", label: "BHM Blue and White Weekend" },
      { href: "/community-events/shoes-for-kids", label: "Shoes for Kids" },
      { href: "/community-events/toys-for-kids", label: "Toys for Kids" },
      { href: "/community-events/scholarship", label: "Scholarship" },
    ],
  },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader({ chapter }: { chapter: CurrentChapter }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0047AB] text-sm font-semibold text-white">
            ΤΣ
          </span>
          <span className="text-lg font-semibold tracking-tight text-[#0047AB]">
            {chapter.name}
          </span>
        </Link>

        <nav id="site-navigation" className="hidden items-center gap-6 lg:flex">
          {NAV_ITEMS.map((item) => (
            <div key={item.label} className="group relative">
              <Link
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-[#0047AB] ${
                  isItemActive(item.href) ? "text-[#0047AB]" : "text-slate-700"
                }`}
              >
                {item.label}
              </Link>
              {item.children ? (
                <div className="absolute left-0 top-full hidden min-w-55 rounded-xl border border-slate-200 bg-white p-3 shadow-lg group-hover:block">
                  {item.children.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href}
                      className={`block rounded-md px-3 py-2 text-sm hover:bg-slate-50 hover:text-[#0047AB] ${
                        isItemActive(child.href) ? "text-[#0047AB]" : "text-slate-600"
                      }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-full bg-[#0047AB] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#003b8e] sm:inline-flex"
          >
            Brother Login
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 lg:hidden"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
          <div className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50 hover:text-[#0047AB] ${
                  isItemActive(item.href) ? "text-[#0047AB]" : "text-slate-700"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
