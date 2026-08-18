# Sanity Editorial and Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Sanity usable for publishing news, galleries, public photos, and videos without code changes.

**Architecture:** Sanity stores public editorial content and image assets. Existing Supabase Storage continues to store private member files. Public queries remain tenant-filtered by chapter slug and published status.

**Tech Stack:** Sanity Studio embedded in Next.js, `next-sanity`, Sanity image URL builder, existing public pages.

**Spec:** `docs/superpowers/specs/2026-08-18-sanity-editorial-media-design.md`

## Global Constraints

- Draft documents must never render publicly.
- Every public image requires alt text.
- Every document requires a chapter slug.
- Do not store large videos in Git or Supabase Storage unless a later private-media requirement demands it.

### Task 1: Verify project and Studio configuration

**Files:** Modify `src/sanity/client.ts`, Studio config/schema entry files found under `src/sanity`, `.env.example`, and `docs/sanity-setup.md`; test `tests/sanity/config.test.ts`.

- [ ] Add a configuration test for project ID and dataset resolution.
- [ ] Verify the test fails when configuration is absent.
- [ ] Document creating the `production` dataset, adding editors, opening `/studio`, and publishing a first post.
- [ ] Run TypeScript, ESLint, and the focused test.
- [ ] Commit `docs: document Sanity Studio setup`.

### Task 2: Complete editorial schemas

**Files:** Modify `src/sanity/schema/post.ts`, `event.ts`, `leader.ts`, `program.ts`; create `src/sanity/schema/gallery.ts` and `video.ts`; modify the schema registry.

- [ ] Add required validation for chapter slug, title, publication state, dates, alt text, and URLs.
- [ ] Add editor descriptions and usable chapter choices for `root` and configured collegiate slugs.
- [ ] Run schema/config tests and TypeScript.
- [ ] Commit `feat: add Sanity editorial media schemas`.

### Task 3: Add gallery and video queries

**Files:** Modify `src/sanity/queries.ts`; create typed query helpers under `src/sanity`; test `tests/sanity/queries.test.ts`.

- [ ] Write tests asserting published and chapter-filtered query definitions.
- [ ] Implement gallery and video queries with deterministic ordering.
- [ ] Run focused tests and lint.
- [ ] Commit `feat: query Sanity galleries and videos`.

### Task 4: Connect public media pages

**Files:** Modify `src/app/(public)/photos/page.tsx`; create `src/app/(public)/media/page.tsx` and focused media components.

- [ ] Add gallery cards, responsive image rendering, captions, alt text, and empty states.
- [ ] Add video cards with safe provider links and thumbnails.
- [ ] Run TypeScript, ESLint, and production build.
- [ ] Commit `feat: publish Sanity photos and videos publicly`.

### Task 5: Editor documentation and launch checklist

**Files:** Modify `docs/sanity-setup.md`; create `docs/sanity-editor-guide.md`.

- [ ] Document creating posts, uploading photos, writing alt text, creating galleries, adding videos, selecting chapter, previewing drafts, and publishing.
- [ ] Include a first-time checklist and troubleshooting for missing datasets, permissions, and stale CDN content.
- [ ] Commit `docs: add Sanity editor guide`.
