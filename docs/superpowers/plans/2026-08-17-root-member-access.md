# Root Chapter Member Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add secure, root-chapter-only brother access with roster verification, admin invitations, pending approval, MFA-protected administration, and Resend-backed interest-form notifications.

**Architecture:** Keep interest submissions independent from accounts in `prospective_members`. Add a protected root roster and a server-only verification path. Continue using Supabase Auth for accounts and invitations, profile fields for approval/administration, existing `chapter_members` for legacy officer capabilities, and Resend for application emails.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase Auth/Postgres/RLS, Zod, existing rate limiter, Resend, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-17-root-member-access-design.md`

## Global Constraints

- Root/Tau Sigma only; collegiate tenants must not expose or authorize member access.
- Interest forms are outreach submissions and never create accounts.
- Membership number is an identifier, never a password or security token.
- Existing Resend domain setup uses `mail.birminghamsigmas.org`; reuse it.
- `chapter_admin` and `super_admin` require approved status and MFA.
- Public inputs require schema validation, bounded lengths, rate limiting, neutral lookup responses, and safe text/email rendering.
- Never commit the source roster workbook or secrets.

### Task 1: Normalize interest-form types and labels

**Files:**
- Modify: `src/lib/validation/schemas.ts`
- Modify: `src/lib/intake/submit-application.ts`
- Modify: `src/app/(public)/join/page.tsx`
- Modify: `src/app/(public)/join/join-form.tsx`
- Modify: `src/app/(public)/join/actions.ts`
- Modify: `src/app/(public)/contact/page.tsx`
- Test: `tests/intake/submit-application.test.ts` or the existing intake test location

**Interfaces:**
- Preserve the existing `submitApplication(chapterId, data)` interface.
- Use the exact form type union `membership_interest | transfer | reactivation` at validation, persistence, and email-template boundaries.

- [ ] Add failing tests for all three accepted form types and rejection of the old label/value.
- [ ] Run the focused intake tests and confirm failure.
- [ ] Update validation, labels, select options, and persisted form type.
- [ ] Add applicant receipt and admin-notification template data containing the human-readable form type.
- [ ] Run focused tests, TypeScript, and lint.
- [ ] Commit `feat: classify membership interest forms`.

### Task 2: Add Resend form notification delivery

**Files:**
- Modify: existing `src/lib/email/*` sender/template modules
- Modify: `src/lib/intake/submit-application.ts`
- Modify: `.env.example` and Resend setup documentation
- Test: `tests/email/*` and `tests/intake/*`

**Interfaces:**
- Add a server-only notification function such as `sendInterestFormNotifications(params): Promise<{ applicantError: Error | null; adminError: Error | null }>`.
- Read server-only configuration for Resend API key, verified sender address under `mail.birminghamsigmas.org`, and administrator recipient.

- [ ] Write tests proving both applicant receipt and administrator notification are attempted after a successful insert.
- [ ] Write tests proving email failure does not erase a successful database submission.
- [ ] Implement escaped, plain-text-safe templates and structured Resend calls.
- [ ] Add environment-variable documentation without exposing values.
- [ ] Run focused tests and verify no client module imports the Resend key.
- [ ] Commit `feat: notify applicants and admins through Resend`.

### Task 3: Import the root roster into a protected schema

**Files:**
- Create: `supabase/migrations/20260818000000_root_member_roster.sql`
- Create or modify: `src/types/database.types.ts` through Supabase type generation
- Create: `src/lib/roster/verify-root-member.ts`
- Test: `tests/roster/verify-root-member.test.ts`

**Interfaces:**
- Define `verifyRootRosterMember(input: { membershipNumber: string; lastName: string }): Promise<{ matched: boolean; rosterId?: string }>`.
- The function must only query the root chapter roster through a server-only narrow path and callers must receive a neutral result.

- [ ] Define a normalized root roster table with unique membership number, chapter ID, names, optional roster email, status, and claim fields.
- [ ] Add RLS preventing public roster reads and writes.
- [ ] Add the root chapter association and constraints.
- [ ] Import only the required roster fields using a controlled local import process; never add the workbook to Git.
- [ ] Add normalization tests for whitespace/case and non-disclosure tests for unmatched records.
- [ ] Generate types and run database/type tests.
- [ ] Commit `feat: add protected root member roster`.

### Task 4: Add root-only member access request flow

**Files:**
- Create: `src/app/(public)/request-access/page.tsx`
- Create: `src/app/(public)/request-access/actions.ts`
- Create: request-access form component and validation tests
- Modify: public navigation/header/footer member links
- Test: `tests/auth/request-access.test.ts`

**Interfaces:**
- Add a server action accepting `{ membershipNumber: string; lastName: string; fullName: string; email: string }` and returning a neutral success/error result.
- Reuse the existing root tenant resolver and rate limiter.

- [ ] Write failing tests for root acceptance, collegiate rejection, invalid input, rate limiting, and neutral responses.
- [ ] Implement server-side root-tenant enforcement and roster verification.
- [ ] Create a pending Supabase Auth/profile request using the preferred email only after successful verification, without auto-approving.
- [ ] Require email verification and prevent duplicate roster claims.
- [ ] Add the public “Request Member Access” UI only for the root tenant.
- [ ] Run focused tests and browser/manual checks on root and collegiate host configurations.
- [ ] Commit `feat: add root member access requests`.

### Task 5: Harden and complete administrator invitations

**Files:**
- Modify: `src/lib/members/invite-member.ts`
- Modify: `src/app/(portal)/members/invite/actions.ts`
- Modify: admin/member pages and actions
- Test: `tests/admin/member-invitations.test.ts`

**Interfaces:**
- Preserve the existing invitation action, but ensure it creates/links the profile and root roster/member record consistently with pending status.

- [ ] Add tests for unknown emails, duplicate invites, root-only scope, and pending status.
- [ ] Ensure invitations cannot create collegiate/root-cross-tenant membership.
- [ ] Link invited users to a roster record when membership number is supplied by an administrator.
- [ ] Keep Supabase Auth invitation delivery separate from Resend interest notifications.
- [ ] Run focused tests and commit `feat: harden root member invitations`.

### Task 6: Enforce MFA for new admin roles

**Files:**
- Modify: `src/lib/auth/authorization.ts`
- Modify: `src/app/(portal)/admin/layout.tsx` and security/MFA routes as needed
- Test: `tests/auth/admin-authorization.test.ts`

**Interfaces:**
- `requireChapterAdmin()` must reject approved `chapter_admin` and `super_admin` users unless Supabase MFA assurance is `aal2`.

- [ ] Add failing tests for missing MFA, satisfied MFA, pending admins, suspended admins, and collegiate host access.
- [ ] Implement the MFA assurance check by reusing Supabase’s existing MFA client path.
- [ ] Redirect MFA-incomplete admins to the existing MFA enrollment/challenge flow.
- [ ] Run focused tests and commit `fix: require MFA for profile administrators`.

### Task 7: Reconcile portal authorization and root-only UI

**Files:**
- Modify: `src/app/(portal)/layout.tsx`
- Modify: `src/app/(portal)/dashboard/page.tsx`
- Modify: root/collegiate navigation conditionals
- Test: `tests/auth/tenant-member-access.test.ts`

**Interfaces:**
- Root member routes use the new approved profile boundary; legacy officer role checks remain only where needed for officer-specific capabilities.

- [ ] Add tests demonstrating approved root members can access member routes and collegiate tenants cannot.
- [ ] Update dashboard access to avoid contradictory profile/legacy checks.
- [ ] Ensure pending and suspended accounts receive deterministic access-denied behavior.
- [ ] Verify no collegiate navigation exposes root member login/signup/admin links.
- [ ] Run the full auth test suite and commit `refactor: scope member portal to root chapter`.

### Task 8: Production configuration and verification

**Files:**
- Modify: `.env.example`
- Modify: `docs/sanity-setup.md` or create `docs/resend-setup.md`
- Test: full project test/build commands

- [ ] Document root chapter ID, roster import, Resend sender/recipient variables, and Vercel environment configuration.
- [ ] Confirm `mail.birminghamsigmas.org` is used as the verified sending domain and no API key is client-exposed.
- [ ] Run focused tests, full tests, TypeScript, ESLint, and production build.
- [ ] Manually verify root staging flows: interest submission, receipt email, admin notification, request access, pending denial, MFA admin access, and invitation fallback.
- [ ] Manually verify collegiate host flows do not expose or authorize member access.
- [ ] Commit `test: verify root member access release`.
