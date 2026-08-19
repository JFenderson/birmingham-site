# Sigma Beta Club and Tau Sigma Charity Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add chapter-scoped Sigma Beta Club and Tau Sigma Charity Foundation public pages, editable through Sanity, without changing the existing site layout or member portal behavior.

**Architecture:** Add two public route trees that reuse existing public layout components, Sanity query helpers, media validation, CTA cards, and Resend form-notification patterns. Sanity stores public content and images; server actions/API routes validate public submissions and send notifications; donation checkout remains an external/Square flow.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind, Sanity Studio/next-sanity, existing Zod validation, existing Resend integration, existing public components, existing Square/external donation flow.

**Spec:** `docs/superpowers/specs/2026-08-19-sigma-beta-foundation-design.md`

## Global Constraints

- Preserve the existing public layout, navigation, tenant resolution, collegiate behavior, and member portal.
- Every public query is chapter-filtered, published-only, draft-safe, and deterministically ordered with `_id asc` as the final key.
- Every public image requires meaningful nonblank alt text and must be omitted if runtime content is invalid.
- Public forms are interest/information workflows only; they never create Supabase accounts or member records.
- Donation/payment credentials never enter Sanity or browser code.
- Sanity-managed links accept internal paths beginning with `/` or approved HTTPS URLs only.
- Do not add a UI framework dependency.

### Task 1: Shared domain types and schema helpers

**Files:**
- Modify: `src/sanity/schema/shared.ts`
- Create: `src/sanity/schema/sigma-beta-settings.ts`, `sigma-beta-event.ts`, `foundation-settings.ts`, `foundation-project.ts`, `foundation-event.ts`, `foundation-board-member.ts`
- Modify: `src/sanity/schema/index.ts`
- Test: `tests/sanity/program-content.test.ts`

- [ ] Write failing tests asserting all seven schema types are registered, chapter slug and published validators exist, event/project ordering fields are nonnegative, and all public image fields require assets plus nonblank alt text.
- [ ] Run `node --test tests/sanity/program-content.test.ts`; verify failure because the new types are absent.
- [ ] Implement the schemas using existing `createChapterSlugField`, `createPublishedField`, `createPublishedAtField`, `createAccessibleImageField`, and safe-link validation. Use exact document names from the spec.
- [ ] Register all new types in `sanitySchemaTypes`.
- [ ] Run the focused schema test, TypeScript, and focused ESLint; commit `feat: add Sigma Beta and foundation Sanity schemas`.

### Task 2: Public Sanity query layer

**Files:**
- Modify: `src/sanity/queries.ts`
- Modify/create: `src/sanity/media.ts` or `src/sanity/program-content.ts`
- Test: `tests/sanity/program-content-queries.test.ts`

- [ ] Write failing tests asserting settings, events, projects, and board/advisor queries include `chapterSlug == $chapterSlug`, `published == true`, draft exclusion, future-date exclusion, and `_id asc` final ordering.
- [ ] Run the focused test and verify it fails before implementation.
- [ ] Add typed result interfaces and helpers: `getSigmaBetaSettings`, `getSigmaBetaEvents`, `getFoundationSettings`, `getFoundationProjects`, `getFoundationEvents`, and `getFoundationBoardMembers`.
- [ ] Return only fields required by the public pages, including validated image alt text and safe link fields.
- [ ] Run focused Sanity tests, TypeScript, and ESLint; commit `feat: query Sigma Beta and foundation content`.

### Task 3: Sigma Beta Club public page

**Files:**
- Create: `src/app/(public)/sigma-beta-club/page.tsx`
- Create: `src/components/public/sigma-beta-club-content.tsx`
- Create: `src/components/public/sigma-beta-interest-form.tsx`
- Modify: existing public form validation/action files only if needed to share notification behavior
- Test: `tests/public-sigma-beta.test.ts`

- [ ] Write failing tests for chapter-scoped settings/events, empty states, safe event links, and neutral form success behavior.
- [ ] Run the focused test and verify failure.
- [ ] Implement the page with sections in this order: overview/hero, mission, upcoming events, interest form, director contact methods, and advisor listing.
- [ ] Render only nonblank-alt images and safe links; use existing `SectionHeading`, cards, CTA, and empty-state styles.
- [ ] Implement the interest form as a public contact workflow with name, email, phone optional, student/parent/guardian context, message, honeypot, validation, rate limiting, and Resend notification. Do not create accounts or Supabase rows.
- [ ] Run focused tests, TypeScript, and ESLint; commit `feat: add Sigma Beta Club page`.

### Task 4: Foundation public page and forms

**Files:**
- Create: `src/app/(public)/foundation/page.tsx`
- Create: `src/components/public/foundation-content.tsx`
- Create: `src/components/public/foundation-information-form.tsx`
- Modify: existing form notification utility only if needed
- Test: `tests/public-foundation.test.ts`

- [ ] Write failing tests for nonprofit overview rendering, project/event/board sections, safe donation URL behavior, and neutral request-information success.
- [ ] Run the focused test and verify failure.
- [ ] Implement sections in this order: nonprofit/501(c)(3) overview, purpose, donation CTA, past projects, foundation events, board listing, and request-more-information form.
- [ ] Keep donation processing external/Square; render no payment secrets and reject unsafe donation URLs.
- [ ] Implement the information form with name, email, organization optional, phone optional, message, honeypot, validation, rate limiting, and Resend notifications. Do not create accounts or member records.
- [ ] Run focused tests, TypeScript, and ESLint; commit `feat: add Tau Sigma Charity Foundation page`.

### Task 5: Navigation, metadata, and content discoverability

**Files:**
- Modify: `src/components/public-header.tsx`
- Modify: `src/app/(public)/about/page.tsx`
- Modify: `src/app/layout.tsx` or route metadata files as appropriate
- Test: `tests/public-navigation.test.ts`

- [ ] Write failing tests asserting links to `/sigma-beta-club` and `/foundation` are present without removing existing navigation items, and collegiate pages do not display root-only member links.
- [ ] Run the focused test and verify failure.
- [ ] Add the two destinations to the existing About submenu or another additive public navigation location; do not redesign the header.
- [ ] Add page metadata and accessible link names; preserve the existing Birmingham Sigmas title template.
- [ ] Run focused tests, TypeScript, and ESLint; commit `feat: add program pages to public navigation`.

### Task 6: Sanity editor documentation and deployment checklist

**Files:**
- Modify: `docs/sanity-editor-guide.md`
- Modify: `docs/sanity-setup.md`
- Create: `docs/sigma-beta-foundation-editor-guide.md`
- Test: `git diff --check`

- [ ] Document creating Sigma Beta settings/events/advisors, foundation settings/projects/events/board members, selecting `root`, adding meaningful alt text, publishing dates, safe donation/registration links, and receiving form notifications.
- [ ] Document that forms do not create accounts and donations are processed through the configured external/Square destination.
- [ ] Add first-content checklists for `/sigma-beta-club` and `/foundation` and troubleshooting for missing Sanity variables, missing chapter configuration, drafts, future publication dates, and empty states.
- [ ] Run `git diff --check`; commit `docs: add Sigma Beta and foundation editor guide`.

### Task 7: Integration verification

**Files:** No source changes expected unless verification exposes a defect.

- [ ] Run all focused tests from Tasks 1–6.
- [ ] Run the complete TypeScript check with `node_modules/.bin/tsc.cmd --noEmit`.
- [ ] Run changed-file ESLint; record unrelated existing lint failures separately.
- [ ] Run the production build with Sanity environment variables configured; if Google Fonts network access fails, rerun in the deployment environment and record it as environmental.
- [ ] Manually verify root and collegiate tenant behavior, 320px and desktop layouts, form success/error states, draft exclusion, and safe donation/registration links.
- [ ] Commit only any required verification fixes using a focused message.
