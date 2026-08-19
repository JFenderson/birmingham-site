import assert from "node:assert/strict";
import test from "node:test";
import type {
  SanityHomepageSettings,
  SanityLeader,
  SanityPastPresident,
} from "../src/sanity/queries.ts";
import {
  getSafeImageAlt,
  resolveHomepageContent,
  resolveLeadershipContent,
  resolvePastPresidentsContent,
} from "../src/lib/public-content.ts";

const meaningfulImage = {
  asset: { _ref: "image-1234567890abcdef1234567890abcdef12345678-1200x800-jpg" },
  alt: "Brothers serving Birmingham families",
};

test("homepage content prefers published Sanity settings while preserving safe defaults", () => {
  const settings: SanityHomepageSettings = {
    _id: "site-settings-root",
    hero: {
      eyebrow: "Root chapter",
      title: "CMS Hero Title",
      description: "CMS hero description.",
      primaryAction: { href: "/about", label: "Learn about us" },
      secondaryAction: { href: "/contact", label: "Contact us" },
      image: { ...meaningfulImage, alt: "   " },
    },
    communityImpact: {
      eyebrow: "CMS impact",
      title: "CMS Community Impact",
      description: "CMS impact description.",
      initiatives: [
        {
          title: "CMS Shoes for Kids",
          description: "CMS service description.",
          link: { href: "/community-events/shoes-for-kids", label: "See the work" },
        },
      ],
    },
    featuredPresident: {
      eyebrow: "From the president",
      title: "CMS President Note",
      description: "CMS president message.",
      name: "Bro. CMS President",
      role: "Chapter President",
      image: { ...meaningfulImage, alt: "\t" },
      link: { href: "/photos", label: "View photos" },
    },
  };

  const content = resolveHomepageContent("Birmingham Sigmas", settings);

  assert.equal(content.hero.title, "CMS Hero Title");
  assert.equal(content.communityImpact.title, "CMS Community Impact");
  assert.equal(content.communityImpact.initiatives[0]?.title, "CMS Shoes for Kids");
  assert.equal(content.featuredPresident.name, "Bro. CMS President");
  assert.equal(getSafeImageAlt(content.hero.image), null);
  assert.equal(getSafeImageAlt(content.featuredPresident.image), null);

  const fallback = resolveHomepageContent("Birmingham Sigmas", null);
  assert.equal(fallback.hero.title, "Birmingham Sigmas");
  assert.equal(fallback.communityImpact.initiatives.length, 3);
});

test("leadership content prefers current executive leaders and only exposes safe portrait alts", () => {
  const leaders: SanityLeader[] = [
    {
      _id: "leader-safe",
      name: "Bro. Safe Portrait",
      role: "Vice President",
      designation: "currentExecutive",
      order: 1,
      portrait: meaningfulImage,
      bio: "Coordinates chapter service programs.",
    },
    {
      _id: "leader-blank",
      name: "Bro. Blank Portrait",
      role: "Treasurer",
      designation: "currentExecutive",
      order: 2,
      portrait: { ...meaningfulImage, alt: " " },
      bio: null,
    },
  ];

  const content = resolveLeadershipContent(leaders);

  assert.equal(content[0]?.name, "Bro. Safe Portrait");
  assert.equal(getSafeImageAlt(content[0]?.portrait), "Brothers serving Birmingham families");
  assert.equal(getSafeImageAlt(content[1]?.portrait), null);
  assert.equal(resolveLeadershipContent([])[0]?.name, "Bro. Joseph Fenderson");
});

test("past presidents content prefers published records and keeps the empty fallback", () => {
  const presidents: SanityPastPresident[] = [
    {
      _id: "past-president-safe",
      name: "Bro. Legacy Leader",
      yearsServed: "2018-2020",
      order: 1,
      featured: true,
      portrait: meaningfulImage,
      bio: "Expanded scholarship and youth service.",
    },
    {
      _id: "past-president-blank",
      name: "Bro. No Alt",
      yearsServed: "2016-2018",
      order: 2,
      featured: false,
      portrait: { ...meaningfulImage, alt: "" },
      bio: null,
    },
  ];

  const empty = resolvePastPresidentsContent([]);
  assert.equal(empty.status, "empty");
  assert.match(empty.notes[0] ?? "", /Historical chapter records/);

  const populated = resolvePastPresidentsContent(presidents);
  assert.equal(populated.status, "populated");
  assert.equal(populated.presidents[0]?.name, "Bro. Legacy Leader");
  assert.equal(getSafeImageAlt(populated.presidents[0]?.portrait), "Brothers serving Birmingham families");
  assert.equal(getSafeImageAlt(populated.presidents[1]?.portrait), null);
});
