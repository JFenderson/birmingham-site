"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { MemberRole } from "@/types/domain";
import { getPortalNavigationSections } from "./portal-navigation";

interface PortalSidebarProps {
  role: MemberRole;
}

export function PortalSidebar({ role }: PortalSidebarProps) {
  const pathname = usePathname();
  const navigation = getPortalNavigationSections(role);

  return (
    <aside className="hidden w-80 shrink-0 border-r border-zinc-200 bg-zinc-50/80 px-6 py-8 dark:border-zinc-800 dark:bg-zinc-950/80 lg:flex lg:flex-col">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-navy/75 dark:text-blue-300">
          Tau Sigma Portal
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Member app
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Quick access to chapter activity, records, dues, and account details.
        </p>
      </div>

      <nav aria-label="Portal navigation" className="space-y-8">
        <PortalSidebarSection
          items={navigation.primary}
          pathname={pathname}
          title="Primary"
        />
        {navigation.chapterTools.length > 0 ? (
          <PortalSidebarSection
            items={navigation.chapterTools}
            pathname={pathname}
            title="Chapter tools"
          />
        ) : null}
      </nav>
    </aside>
  );
}

function PortalSidebarSection({
  items,
  pathname,
  title,
}: {
  items: ReturnType<typeof getPortalNavigationSections>["primary"];
  pathname: string;
  title: string;
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = isPortalPathActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              aria-current={isActive ? "page" : undefined}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-navy text-white shadow-sm hover:bg-navy-dark dark:bg-blue-400 dark:text-zinc-950 dark:hover:bg-blue-300"
                  : "text-zinc-700 hover:bg-white hover:text-navy dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-blue-300",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function isPortalPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
