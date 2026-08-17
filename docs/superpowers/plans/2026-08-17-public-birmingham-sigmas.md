# Public Birmingham Sigmas Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the existing public routes into a complete Birmingham Sigmas website with a cohesive responsive visual system.

**Architecture:** Preserve App Router route groups and tenant lookup. Build reusable public section components and update the public shell, homepage, and existing content pages without changing Supabase or portal behavior.

**Tech Stack:** Next.js 16.2.12, React 19, Tailwind CSS 4, lucide-react, Sanity.

**Spec:** `docs/superpowers/specs/2026-08-17-birmingham-sigmas-platform-design.md`

## Global Constraints

- Keep the existing Next.js App Router structure and public/portal route groups.
- Use the approved royal-blue-and-white visual system.
- Do not copy proprietary reference-site text or imagery verbatim.
- Preserve existing portal, authentication, Sanity, and Supabase behavior.

### Task 1: Public shell and design tokens

**Files:** Modify `src/app/globals.css`, `src/app/layout.tsx`, `src/components/public-header.tsx`, `src/components/public-footer.tsx`.

- [ ] Add typography, spacing, surface, focus, and responsive navigation tokens.
- [ ] Update header to support a branded announcement strip, desktop navigation, mobile menu, and clear member-login CTA.
- [ ] Update footer with chapter summary, navigation groups, affiliate links, and social/contact affordances.
- [ ] Run `npm run lint` and verify no portal-only styles regress.

### Task 2: Reusable public sections

**Files:** Create `src/components/public/hero.tsx`, `src/components/public/section-heading.tsx`, `src/components/public/impact-card.tsx`, `src/components/public/content-cta.tsx`.

- [ ] Define typed props for each component and use accessible headings/buttons/links.
- [ ] Add responsive image treatment using `next/image` only for configured sources; use CSS backgrounds only for decorative imagery.
- [ ] Add focused keyboard and reduced-motion behavior through existing global styles.
- [ ] Run `npm run lint`.

### Task 3: Homepage composition

**Files:** Modify `src/app/(public)/page.tsx`.

- [ ] Compose hero, principles, chapter story, president message, impact initiatives, latest news/events, and contact CTA using the reusable sections.
- [ ] Keep `getCurrentChapter()` as the source for chapter identity.
- [ ] Add stable links for `/about`, `/photos`, `/news`, `/community-events`, and `/contact`.
- [ ] Run `npm run build` and inspect the generated homepage route.

### Task 4: Public page consistency

**Files:** Modify existing public route pages under `src/app/(public)/` as needed.

- [ ] Apply shared spacing, heading, card, empty-state, and CTA patterns to About, Photos, News, Events, Contact, Join, and Login pages.
- [ ] Preserve route behavior and server data fetching.
- [ ] Run `npm run lint` and `npm run build`.

