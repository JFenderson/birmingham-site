# Member/admin UI foundation

Implement a minimal protected portal/admin surface using the new authorization helpers.

**Files:** Create `src/app/(portal)/admin/layout.tsx`, `src/app/(portal)/admin/page.tsx`, `src/app/(portal)/account/page.tsx`, and small presentational components under `src/components/admin/` only if needed. Inspect existing `src/app/(portal)/layout.tsx`, dashboard, and login pages first.

- Admin layout must call `requireChapterAdmin()` server-side and expose a clear unauthorized/error state through existing conventions.
- Admin page should provide useful navigation cards to member management, content, events, news, photos, and settings, even if some routes are not implemented yet; do not create dead links to nonexistent pages without labeling them as planned.
- Account page must call `requireApprovedMember()` and display safe profile fields/status/role; do not permit editing authorization fields.
- Preserve existing portal layout and unrelated user changes.
- Run direct TypeScript/ESLint checks if npm scripts are unavailable.

Write a report to `.superpowers/sdd/2026-08-17-member-admin-ui-report.md`. Return only status, one-line test summary, and concerns.
