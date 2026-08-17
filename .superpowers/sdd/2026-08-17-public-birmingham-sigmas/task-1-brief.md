# Task 1: Public shell and design tokens

**Files:** Modify `src/app/globals.css`, `src/app/layout.tsx`, `src/components/public-header.tsx`, `src/components/public-footer.tsx`.

- Add typography, spacing, surface, focus, and responsive navigation tokens.
- Update header to support a branded announcement strip, desktop navigation, mobile menu, and clear member-login CTA.
- Update footer with chapter summary, navigation groups, affiliate links, and social/contact affordances.
- Run `npm run lint` and verify no portal-only styles regress.

## Context

This is Task 1 of the public Birmingham Sigmas implementation plan. Preserve the existing App Router, route links, chapter prop contracts, and portal behavior. Use the approved royal-blue-and-white visual system; do not copy proprietary reference-site text or imagery verbatim. The current workspace contains unrelated user changes—do not reset, clean, or overwrite them. If npm is unavailable, report that clearly and use the available local checks.

## Report contract

Write a report to `.superpowers/sdd/2026-08-17-public-birmingham-sigmas/task-1-report.md` containing files changed, tests run, results, and concerns. Return only status, commit hash if any, one-line test summary, and concerns.
