import { Menu } from "lucide-react";
import Link from "next/link";
import type { MemberRole } from "@/types/domain";
import {
  getPortalNavigationSections,
  type PortalNavItem,
} from "./portal-navigation";

interface PortalHeaderProps {
  role: MemberRole;
}

export function PortalHeader({ role }: PortalHeaderProps) {
  const navigation = getPortalNavigationSections(role);

  return (
    <header className="border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-10">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-navy/75 dark:text-blue-300">
            Tau Sigma Portal
          </p>
          <h1 className="truncate text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Member workspace
          </h1>
        </div>

        <div className="hidden rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 lg:block">
          {role}
        </div>

        <details className="group relative lg:hidden">
          <summary className="flex list-none items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-navy hover:text-navy dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-blue-300 dark:hover:text-blue-300">
            <Menu className="size-4" aria-hidden="true" />
            Menu
          </summary>

          <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-72 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Signed in role
              </p>
              <p className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">{role}</p>
            </div>

            <nav aria-label="Portal menu" className="space-y-4">
              <PortalMenuSection items={navigation.primary} title="Primary" />
              {navigation.chapterTools.length > 0 ? (
                <PortalMenuSection items={navigation.chapterTools} title="Chapter tools" />
              ) : null}
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}

function PortalMenuSection({
  items,
  title,
}: {
  items: readonly PortalNavItem[];
  title: string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-navy dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-blue-300"
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
