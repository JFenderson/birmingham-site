# Collegiate Microsites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the site host-aware and ready to render shared collegiate chapter microsites from chapter-specific data.

**Architecture:** Extend the existing tenant resolver behind a typed `SiteContext`. Main Birmingham Sigmas remains the default tenant. Future subdomains resolve to the same template and data contracts without duplicating routes or components.

**Tech Stack:** Next.js 16.2.12 App Router/proxy, TypeScript, Supabase, Sanity, Tailwind CSS 4.

**Spec:** `docs/superpowers/specs/2026-08-17-birmingham-sigmas-platform-design.md`

## Global Constraints

- The first delivery focuses on the main Birmingham Sigmas site.
- Future subdomains include hosts such as `miles.birminghamsigmas.org`.
- Unknown hosts must fail safely or fall back to the main site according to route type.
- Chapter admins can manage only their chapter-scoped content.

### Task 1: Typed site context

**Files:** Modify `src/lib/tenant/constants.ts`, `src/lib/tenant/resolve-chapter.ts`, `src/lib/tenant/get-chapter.ts`; create `src/lib/tenant/site-context.ts` and tests.

- [ ] Define `SiteContext` with `siteType`, `chapterId`, `host`, `name`, `slug`, branding, and status.
- [ ] Resolve localhost, production main host, and subdomain host deterministically.
- [ ] Normalize ports and case; reject malformed or unconfigured hosts.
- [ ] Add tests for main host, collegiate subdomain, localhost, and unknown host.

### Task 2: Chapter data contract

**Files:** Create a Supabase migration under `supabase/migrations/`, modify `src/types/domain.ts`, `src/types/database.types.ts`.

- [ ] Add chapter/site fields for slug, host key, site type, logo, colors, contact details, and publication status.
- [ ] Define typed chapter content references for leadership, events, photos, and news.
- [ ] Add RLS rules for public published reads and chapter-admin scoped writes.
- [ ] Apply migration and verify main Birmingham Sigmas seed/config remains available.

### Task 3: Shared collegiate template

**Files:** Create `src/components/collegiate/collegiate-shell.tsx`, `src/components/collegiate/collegiate-home.tsx`, `src/app/(public)/collegiate/page.tsx`.

- [ ] Render site context branding, chapter intro, leadership, initiatives, events, photos, news, and contact sections.
- [ ] Keep the component data-driven and avoid chapter-specific conditionals.
- [ ] Add accessible fallback states for missing logo, content, or unpublished sections.
- [ ] Run lint and build.

### Task 4: Host-aware route seam

**Files:** Modify `src/proxy.ts`, public layout and tenant consumers as required; add route tests.

- [ ] Make host resolution available to the public layout and collegiate route without client-side host parsing.
- [ ] Ensure the main site uses the existing public pages while collegiate hosts use the shared template.
- [ ] Verify unknown hosts return the defined safe fallback and do not expose another chapter’s content.
- [ ] Run `npm run lint`, `npm run build`, and focused host-resolution tests.

