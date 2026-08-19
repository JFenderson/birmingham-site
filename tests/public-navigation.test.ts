import assert from "node:assert/strict";
import test from "node:test";

import { NAV_ITEMS } from "../src/components/public-header.tsx";

const PRE_EXISTING_TOP_LEVEL = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/photos", label: "Photos" },
  { href: "/news", label: "News" },
  { href: "/community-events", label: "Events" },
  { href: "/contact", label: "Contact" },
];

const PRE_EXISTING_ABOUT_CHILDREN = [
  { href: "/about/programs", label: "Programs" },
  { href: "/about/leadership", label: "Leadership" },
  { href: "/about/past-presidents", label: "Past Presidents" },
  { href: "/about/active-roster", label: "Active Roster" },
];

function findItem(href: string): (typeof NAV_ITEMS)[number] | undefined {
  return NAV_ITEMS.find((item) => item.href === href);
}

function flattenLinks(): Array<{ href: string; label: string }> {
  const links: Array<{ href: string; label: string }> = [];
  for (const item of NAV_ITEMS) {
    links.push({ href: item.href, label: item.label });
    if (item.children) {
      for (const child of item.children) {
        links.push({ href: child.href, label: child.label });
      }
    }
  }
  return links;
}

test("NAV_ITEMS still contains all pre-existing top-level entries unchanged", () => {
  for (const expected of PRE_EXISTING_TOP_LEVEL) {
    const actual = findItem(expected.href);
    assert.ok(actual, `expected NAV_ITEMS to contain a top-level item for ${expected.href}`);
    assert.equal(actual?.label, expected.label);
  }
});

test("NAV_ITEMS About submenu still contains all pre-existing children unchanged", () => {
  const about = findItem("/about");
  assert.ok(about?.children, "expected About item to still have children");
  for (const expected of PRE_EXISTING_ABOUT_CHILDREN) {
    const actual: { href: string; label: string } | undefined = about?.children?.find(
      (child) => child.href === expected.href,
    );
    assert.ok(actual, `expected About submenu to contain ${expected.href}`);
    assert.equal(actual?.label, expected.label);
  }
});

test("Sigma Beta Club and Foundation links are present with clear accessible labels", () => {
  const links = flattenLinks();

  const sigmaBeta = links.find((link) => link.href === "/sigma-beta-club");
  assert.ok(sigmaBeta, "expected a nav link to /sigma-beta-club");
  assert.equal(sigmaBeta?.label, "Sigma Beta Club");

  const foundation = links.find((link) => link.href === "/foundation");
  assert.ok(foundation, "expected a nav link to /foundation");
  assert.equal(foundation?.label, "Foundation");
});

test("new nav link labels are not vague/generic link text", () => {
  const vagueLabels = ["learn more", "click here", "read more", "here"];
  const links = flattenLinks();
  for (const link of links) {
    assert.equal(
      vagueLabels.includes(link.label.toLowerCase()),
      false,
      `nav label "${link.label}" for ${link.href} should not be generic link text`,
    );
  }
});
