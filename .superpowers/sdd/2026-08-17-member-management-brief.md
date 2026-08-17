# Admin member-management workflow

Implement the missing member-management workflow in the current codebase.

Read first: `src/app/(portal)/admin/page.tsx`, `src/app/(portal)/admin/layout.tsx`, `src/lib/auth/authorization.ts`, `src/lib/auth/member.ts`, `src/types/database.types.ts`, `src/lib/validation/schemas.ts`, and existing server-action patterns under `src/app/(portal)`.

Deliver:

- Create `src/app/(portal)/admin/members/page.tsx` with a server-rendered member list scoped to the current chapter for chapter admins and global for super admins.
- Create `src/app/(portal)/admin/members/actions.ts` with server actions for approve, suspend, restore, and role assignment.
- Add validation schemas for member id, status, and role; reject invalid transitions and self-demotion.
- Enforce `requireChapterAdmin()` inside every action and use the request-scoped Supabase client/RLS; do not use service-role credentials.
- Update admin navigation/cards to link to `/admin/members` instead of calling member management planned.
- Add accessible forms/buttons and clear empty/error states.
- Run TypeScript, ESLint, and diff checks. Do not touch public UI or tenant routing.

Write `.superpowers/sdd/2026-08-17-member-management-report.md` and return only status, tests, and concerns.
