# Member/admin foundation task

Implement the first secure foundation for verified member and admin access in the current workspace.

**Inspect first:** `src/lib/tenant/`, `src/types/domain.ts`, `src/types/database.types.ts`, `src/app/(portal)/layout.tsx`, `src/lib/validation/schemas.ts`, and existing Supabase helpers.

**Deliverables:**

- Create `src/lib/auth/authorization.ts` with typed role/status unions and reusable server-side guards: `getAuthenticatedMember()`, `requireApprovedMember()`, `requireChapterAdmin()`, and `requireSuperAdmin()`.
- Create `src/lib/auth/member.ts` for the member context type and safe profile lookup using existing Supabase SSR patterns.
- Add a timestamped SQL migration under `supabase/migrations/` for member profile fields/status/role constraints and safe RLS policies, following the project’s existing schema conventions. Do not invent secrets or service-role bypasses.
- Update `src/types/domain.ts` only if needed to expose the new typed context.
- Add focused tests if the repo has a runnable test setup; otherwise perform direct TypeScript/ESLint checks.

**Security requirements:** anonymous, pending, and suspended users must be rejected by approved-member guards; chapter admins are chapter-scoped; super admins are global; UI visibility is not the security boundary.

**Do not:** change public UI, reset/clean unrelated changes, or dispatch subagents.

Write a report to `.superpowers/sdd/2026-08-17-member-admin-foundation-report.md` listing files, checks, results, and concerns. Return only status, one-line test summary, and concerns.
