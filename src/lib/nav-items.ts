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
  { href: "/sigma-beta-club", label: "Sigma Beta Club" },
  { href: "/foundation", label: "Foundation" },
  { href: "/initiatives", label: "Initiatives" },
  { href: "/contact", label: "Contact" },
];
