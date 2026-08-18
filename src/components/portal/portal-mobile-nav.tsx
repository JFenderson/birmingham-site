"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { MemberRole } from "@/types/domain";
import { getPortalNavigationSections } from "./portal-navigation";

interface PortalMobileNavProps {
  role: MemberRole;
}

export function PortalMobileNav({ role }: PortalMobileNavProps) {
  const pathname = usePathname();
  const navigation = getPortalNavigationSections(role);

  return (
    <nav
      aria-label="Primary portal navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 lg:hidden"
    >
      <ul className="grid grid-cols-5 gap-1">
        {navigation.primary.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                aria-current={isActive ? "page" : undefined}
                href={item.href}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-semibold transition",
                  isActive
                    ? "bg-navy text-white shadow-sm dark:bg-blue-400 dark:text-zinc-950"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-navy dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-blue-300",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
