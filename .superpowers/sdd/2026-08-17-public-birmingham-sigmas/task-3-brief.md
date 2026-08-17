# Task 3: Homepage composition

**Files:** Modify `src/app/(public)/page.tsx`.

- Compose hero, principles, chapter story, president message, impact initiatives, latest news/events, and contact CTA using reusable sections.
- Keep `getCurrentChapter()` as the source for chapter identity.
- Add stable links for `/about`, `/photos`, `/news`, `/community-events`, and `/contact`.
- Keep the page a server component and use existing data sources only; do not invent Sanity queries in this task.
- Run direct ESLint/TypeScript checks if npm scripts are unavailable.

## Context

Task 1 established public tokens and Task 2 created components in `src/components/public/`. Preserve existing routes and use representative text based on the current chapter copy, not reference-site verbatim text. Do not change portal/auth files.

## Report contract

Write a report to `.superpowers/sdd/2026-08-17-public-birmingham-sigmas/task-3-report.md` containing files changed, tests run, results, and concerns. Return only status, commit hash if any, one-line test summary, and concerns.
