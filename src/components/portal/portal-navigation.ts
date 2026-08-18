import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  FolderLock,
  Home,
  Shield,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import type { MemberRole } from "@/types/domain";

export interface PortalNavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  roles?: readonly MemberRole[];
}

const PRIMARY_PORTAL_NAV: readonly PortalNavItem[] = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/events", icon: Sparkles, label: "Events" },
  { href: "/vault", icon: FolderLock, label: "Vault" },
  { href: "/pay", icon: CreditCard, label: "Pay" },
  { href: "/account", icon: UserRound, label: "Account" },
];

const CHAPTER_TOOL_NAV: readonly PortalNavItem[] = [
  {
    href: "/intake",
    icon: Users,
    label: "Intake",
    roles: ["Intake Director", "Admin"],
  },
  {
    href: "/members/invite",
    icon: UserRound,
    label: "Invite Brother",
    roles: ["Secretary", "Intake Director", "Admin"],
  },
  {
    href: "/admin",
    icon: Shield,
    label: "Admin",
    roles: ["Admin"],
  },
] as const;

export function getPortalNavigationSections(role: MemberRole) {
  return {
    primary: [...PRIMARY_PORTAL_NAV],
    chapterTools: CHAPTER_TOOL_NAV.filter((item) => item.roles?.includes(role)),
  };
}
