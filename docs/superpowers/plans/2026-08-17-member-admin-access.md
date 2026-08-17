# Member and Admin Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add verified member access and a secure admin workspace to the existing Supabase-backed portal.

**Architecture:** Store identity, membership status, and role in Supabase. Centralize server-side authorization helpers and enforce them in layouts, server actions, route handlers, and RLS policies. Reuse existing vault, intake, payment, and security features.

**Tech Stack:** Next.js 16.2.12, Supabase Auth/SSR, Supabase Postgres/RLS, Zod, React.

**Spec:** `docs/superpowers/specs/2026-08-17-birmingham-sigmas-platform-design.md`

## Global Constraints

- Pending or suspended users cannot access member-only content.
- UI visibility is not the security boundary.
- Chapter admins are scoped to their chapter; super admins are global.
- Existing protected features must continue to function.

### Task 1: Membership schema and policies

**Files:** Create a timestamped migration under `supabase/migrations/`, modify `src/types/database.types.ts` after generation.

- [ ] Add member profile fields for `chapter_id`, `membership_status`, `role`, `approved_at`, `approved_by`, and timestamps.
- [ ] Add constraints for `pending`, `approved`, `suspended` and `member`, `chapter_admin`, `super_admin`.
- [ ] Add RLS policies for self-read/update, approved-member access, chapter-admin scoped management, and super-admin global management.
- [ ] Apply the migration locally and verify policy behavior with SQL checks.

### Task 2: Authorization service

**Files:** Create `src/lib/auth/authorization.ts`, `src/lib/auth/member.ts`, tests under `src/lib/auth/__tests__/`.

- [ ] Implement `getAuthenticatedMember(): Promise<MemberContext | null>`.
- [ ] Implement `requireApprovedMember()`, `requireChapterAdmin()`, and `requireSuperAdmin()` that throw typed authorization errors.
- [ ] Add tests for anonymous, pending, suspended, approved member, chapter admin, and super admin contexts.
- [ ] Run the focused test command used by the repository and `npm run lint`.

### Task 3: Approval and role management actions

**Files:** Create `src/app/(portal)/admin/members/actions.ts`, `src/lib/validation/admin-schemas.ts`, `src/app/(portal)/admin/members/page.tsx`.

- [ ] Add validated approve, suspend, restore, and role-assignment server actions.
- [ ] Re-check authorization inside every action before mutation.
- [ ] Render filters, status badges, empty states, and confirmation affordances.
- [ ] Test direct unauthorized action calls and authorized scoped mutations.

### Task 4: Member portal states and settings

**Files:** Modify `src/app/(portal)/layout.tsx`, `src/app/(portal)/dashboard/page.tsx`; create `src/app/(portal)/account/page.tsx` and pending/suspended state components.

- [ ] Gate portal content through `requireApprovedMember()`.
- [ ] Show clear pending and suspended experiences with contact guidance.
- [ ] Add account settings for safe profile fields and sign-out.
- [ ] Verify existing vault, intake, payment, and MFA routes remain reachable only under intended roles.

### Task 5: Admin workspace shell

**Files:** Create `src/app/(portal)/admin/layout.tsx`, `src/app/(portal)/admin/page.tsx`, reusable admin UI components under `src/components/admin/`.

- [ ] Add server-side admin gating and navigation for members, content, events, news, photos, and settings.
- [ ] Add loading, unauthorized, empty, and error states.
- [ ] Run lint, build, and route-level authorization checks.

