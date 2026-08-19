"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import { ROOT_SLUG } from "@/lib/tenant/constants";
import type { CurrentChapter } from "@/lib/tenant/get-chapter";
import { getChapterMark, getPublicBranding } from "@/lib/tenant/site-context";

export const NAV_ITEMS = [
  { href: "/", label: "Home" },
  {
    href: "/about",
    label: "About",
    children: [
      { href: "/about/programs", label: "Programs" },
      { href: "/about/leadership", label: "Leadership" },
      { href: "/about/past-presidents", label: "Past Presidents" },
      { href: "/about/active-roster", label: "Active Roster" },
      { href: "/sigma-beta-club", label: "Sigma Beta Club" },
      { href: "/foundation", label: "Foundation" },
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
  const [openDesktopMenu, setOpenDesktopMenu] = useState<string | null>(null);
  const pathname = usePathname();
  const announcement =
    chapter.siteType === "collegiate"
      ? `${chapter.name} · Brotherhood, scholarship, and service.`
      : "Serving Birmingham through brotherhood, scholarship, and service.";
  const showMemberLinks = chapter.chapterSlug === ROOT_SLUG;
  const publicBranding = getPublicBranding(chapter);

  const isItemActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isCurrentPage = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--public-border)] bg-[color:var(--public-surface)] shadow-sm">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-[var(--public-blue)] px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>
      <div className="bg-[var(--public-blue-deep)] text-white">
        <Link
          href="/community-events"
          className="mx-auto flex min-h-[var(--public-announcement-height)] max-w-[var(--public-content-max)] items-center justify-center gap-2 px-[var(--public-gutter)] py-2 text-center text-xs font-medium tracking-wide hover:bg-white/10 sm:text-sm"
        >
          <span>{announcement}</span>
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
        </Link>
      </div>

      <div className="mx-auto flex min-h-[var(--public-navigation-height)] max-w-[var(--public-content-max)] items-center justify-between gap-5 px-[var(--public-gutter)] py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setMobileOpen(false)}>
          {publicBranding.logoUrl ? (
            <Image
              src={publicBranding.logoUrl}
              alt={publicBranding.logoAlt}
              width={44}
              height={44}
              unoptimized
              className="h-11 w-11 shrink-0 rounded-full object-contain shadow-sm"
            />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--public-blue)] text-sm font-semibold text-white shadow-sm">
              {getChapterMark(chapter)}
            </span>
          )}
          <span className="truncate font-[family-name:var(--public-font-display)] text-base font-bold tracking-tight text-[var(--public-ink)] sm:text-lg">
            {publicBranding.text}
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const desktopMenuId = `desktop-${item.label.toLowerCase()}-submenu`;
            const isDesktopMenuOpen = openDesktopMenu === item.label;

            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.children && setOpenDesktopMenu(item.label)}
                onMouseLeave={() => item.children && setOpenDesktopMenu(null)}
                onFocus={() => item.children && setOpenDesktopMenu(item.label)}
                onBlur={(event) => {
                  const nextTarget = event.relatedTarget;
                  if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
                    setOpenDesktopMenu(null);
                  }
                }}
              >
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    aria-current={isCurrentPage(item.href) ? "page" : undefined}
                    className={`rounded-l-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-[var(--public-surface-strong)] hover:text-[var(--public-blue)] ${
                      isItemActive(item.href) ? "text-[var(--public-blue)]" : "text-slate-700"
                    } ${item.children ? "pr-1" : "rounded-r-md"}`}
                  >
                    {item.label}
                  </Link>
                  {item.children ? (
                    <button
                      type="button"
                      aria-controls={desktopMenuId}
                      aria-expanded={isDesktopMenuOpen}
                      aria-haspopup="true"
                      aria-label={`Toggle ${item.label} submenu`}
                      onClick={() => setOpenDesktopMenu((value) => (value === item.label ? null : item.label))}
                      className="rounded-r-md py-2 pr-3 pl-1 text-slate-700 transition-colors hover:bg-[var(--public-surface-strong)] hover:text-[var(--public-blue)]"
                    >
                      <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
                {item.children ? (
                  <div
                    id={desktopMenuId}
                    aria-label={`${item.label} submenu`}
                    hidden={!isDesktopMenuOpen}
                    className="absolute left-0 top-full z-40 w-64 rounded-xl border border-[var(--public-border)] bg-[var(--public-surface)] p-2 shadow-[var(--public-shadow)]"
                  >
                  {item.children.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href}
                      aria-current={isCurrentPage(child.href) ? "page" : undefined}
                      className={`block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[var(--public-surface-subtle)] hover:text-[var(--public-blue)] ${
                        isItemActive(child.href) ? "font-semibold text-[var(--public-blue)]" : "text-slate-600"
                      }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {showMemberLinks ? (
            <>
              <Link
                href="/login"
                className="inline-flex items-center rounded-full bg-[var(--public-blue)] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--public-blue-deep)] sm:px-4"
              >
                Member Login
              </Link>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--public-border)] text-[var(--public-ink)] transition-colors hover:bg-[var(--public-surface-subtle)] lg:hidden"
            aria-controls="mobile-site-navigation"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <nav
          id="mobile-site-navigation"
          aria-label="Mobile navigation"
          className="border-t border-[var(--public-border)] bg-[var(--public-surface)] px-[var(--public-gutter)] py-4 lg:hidden"
        >
          <div className="mx-auto max-w-[var(--public-content-max)] space-y-1">
            {NAV_ITEMS.map((item) => (
              <div key={item.label}>
                <Link
                  href={item.href}
                  aria-current={isCurrentPage(item.href) ? "page" : undefined}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--public-surface-subtle)] hover:text-[var(--public-blue)] ${
                    isItemActive(item.href) ? "bg-[var(--public-surface-strong)] text-[var(--public-blue)]" : "text-slate-700"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
                {item.children ? (
                  <div className="ml-3 border-l border-[var(--public-border)] py-1 pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        aria-current={isCurrentPage(child.href) ? "page" : undefined}
                        className={`block rounded-md px-3 py-2 text-sm transition-colors hover:bg-[var(--public-surface-subtle)] hover:text-[var(--public-blue)] ${
                          isItemActive(child.href) ? "font-semibold text-[var(--public-blue)]" : "text-slate-600"
                        }`}
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {showMemberLinks ? (
              <div className="mt-3 grid gap-2 border-t border-[var(--public-border)] pt-4">
                <Link
                  href="/login"
                  className="block rounded-lg bg-[var(--public-blue)] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--public-blue-deep)]"
                  onClick={() => setMobileOpen(false)}
                >
                  Member Login
                </Link>
              </div>
            ) : null}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
