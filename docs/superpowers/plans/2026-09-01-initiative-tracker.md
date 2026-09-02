# Initiative Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a no-login Black Spending and daily steps tracker with automatic approval, evidence uploads, monthly totals, director reports, and public rankings.

**Architecture:** Supabase-backed Server Actions validate and insert submissions, with private evidence storage and token-based participant cleanup. Public pages expose approved aggregates and abbreviated names; chapter-admin pages expose reports and CSV export.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase, Zod, Tailwind.

**Spec:** `docs/superpowers/specs/2026-09-01-initiative-tracker-design.md`

## Global Constraints

- No participant login or account creation.
- Submissions are automatically approved after validation.
- Public names must be first initial plus last name.
- Evidence files are private and never publicly listed.
- Director operations require existing chapter-admin authorization and MFA.

### Task 1: Data model and validation

**Files:** Create a Supabase migration and tracker validation module; test validation and public-name formatting.

- [ ] Write failing tests for both initiative payloads, invalid evidence metadata, and `J. Smith` formatting.
- [ ] Run the focused tests and confirm they fail because the module is absent.
- [ ] Add `initiative_submissions` schema, indexes, cleanup token hash, evidence metadata, storage bucket policies, and RLS that permits only server-side writes plus safe approved aggregate reads.
- [ ] Add Zod schemas and pure helpers for validation, public display names, monthly totals, and CSV escaping.
- [ ] Run focused tests and confirm they pass.

### Task 2: Public submission flow

**Files:** Create tracker server actions, upload form components, initiative page, and navigation entry; add action tests.

- [ ] Write failing tests for accepted Black Spending and Steps submissions, automatic approval, generated private token, and rejection of honeypot/rate-limit/file violations.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement server-side validation, private evidence upload, insert, and success response without exposing full names or storage paths.
- [ ] Build responsive chooser/form UI with remembered local names, evidence previews, and success state.
- [ ] Run focused tests and lint.

### Task 3: Public rankings and totals

**Files:** Create public tracker query helpers/components and tests.

- [ ] Write failing tests for month totals, per-person rankings, abbreviated names, and empty states.
- [ ] Implement approved-only queries and accessible cards/table UI for both initiatives.
- [ ] Run tests and lint.

### Task 4: Director report dashboard

**Files:** Create protected director page/actions, CSV export helper, and tests.

- [ ] Write failing tests for chapter-admin authorization, month filtering, correction/removal via token, and CSV export.
- [ ] Implement protected dashboard using existing RBAC, monthly totals, submission table, soft deletion/correction, and download response.
- [ ] Run tests, lint, and production build.

### Task 5: Verification and documentation

- [ ] Run the full test suite, lint, and build.
- [ ] Verify migration and environment assumptions against Supabase config.
- [ ] Document setup for the private bucket and director workflow.
