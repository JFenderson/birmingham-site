# Mobile-First Member Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restyle the authenticated portal as a branded, mobile-first member app without changing authorization or data behavior.

**Architecture:** Keep the existing route tree and server authorization. Add focused portal UI components and use them from the existing portal layout and pages. Mobile uses a fixed bottom navigation; desktop uses a sidebar.

**Tech Stack:** Next.js 16, React, Tailwind CSS, existing icon/UI dependencies, Supabase-backed server pages.

**Spec:** `docs/superpowers/specs/2026-08-18-mobile-member-portal-design.md`

## Global Constraints

- Preserve all existing role, tenant, and MFA checks.
- Support 320px mobile width and desktop layouts.
- Do not add a UI framework dependency.

### Task 1: Portal shell and navigation

**Files:** Modify `src/app/(portal)/layout.tsx`; create `src/components/portal/portal-sidebar.tsx`, `src/components/portal/portal-mobile-nav.tsx`, and `src/components/portal/portal-header.tsx`; test `tests/portal/navigation.test.ts`.

- [ ] Write tests asserting the role-to-navigation mapping: Member sees five primary links; Admin additionally sees Intake, Invite Brother, and Admin.
- [ ] Run the focused test and verify it fails before implementation.
- [ ] Implement typed navigation configuration and responsive shell components.
- [ ] Run TypeScript, ESLint, and the focused test.
- [ ] Commit `feat: add mobile-first member portal shell`.

### Task 2: Shared portal visual primitives

**Files:** Create `src/components/portal/portal-card.tsx`, `portal-page-header.tsx`, `portal-status-badge.tsx`, `portal-empty-state.tsx`; modify `src/app/globals.css`; test `tests/portal/primitives.test.ts`.

- [ ] Write tests for status badge variants and accessible empty-state headings.
- [ ] Verify the tests fail.
- [ ] Implement responsive cards, page headers, badges, alerts, and empty states using existing Tailwind tokens.
- [ ] Run focused tests, TypeScript, and ESLint.
- [ ] Commit `feat: add shared portal UI primitives`.

### Task 3: Dashboard redesign

**Files:** Modify `src/app/(portal)/dashboard/page.tsx`; create `src/components/portal/dashboard-card.tsx`; test `tests/portal/dashboard.test.ts`.

- [ ] Write tests for the dashboard’s primary member status sections.
- [ ] Verify failure.
- [ ] Implement mobile-first dashboard cards for events, vault, payments, and account status using existing data access.
- [ ] Run focused tests and production checks.
- [ ] Commit `feat: redesign member dashboard`.

### Task 4: Restyle existing portal pages

**Files:** Modify `src/app/(portal)/events/page.tsx`, `src/app/(portal)/vault/page.tsx`, `src/app/(portal)/pay/page.tsx`, `src/app/(portal)/account/page.tsx`, `src/app/(portal)/intake/page.tsx`, `src/app/(portal)/admin/page.tsx`, and related forms.

- [ ] Add page headers, responsive spacing, cards, mobile-safe forms, and empty/loading states without changing actions or queries.
- [ ] Run TypeScript, ESLint, and a production build.
- [ ] Manually verify 320px and desktop layouts.
- [ ] Commit `feat: style member portal pages`.
