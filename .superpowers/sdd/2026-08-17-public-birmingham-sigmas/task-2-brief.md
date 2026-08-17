# Task 2: Reusable public sections

**Files:** Create `src/components/public/hero.tsx`, `src/components/public/section-heading.tsx`, `src/components/public/impact-card.tsx`, `src/components/public/content-cta.tsx`.

- Define typed props for each component and use accessible headings/buttons/links.
- Add responsive image treatment using `next/image` only for configured sources; use CSS backgrounds only for decorative imagery.
- Add focused keyboard and reduced-motion behavior through existing global styles.
- Run direct ESLint/TypeScript checks if npm scripts are unavailable.

## Context

This is Task 2 of the public Birmingham Sigmas implementation plan. Preserve the existing App Router and keep these components presentational and reusable. Use the existing royal-blue-and-white tokens from `globals.css`. Do not modify portal routes or the homepage yet.

## Report contract

Write a report to `.superpowers/sdd/2026-08-17-public-birmingham-sigmas/task-2-report.md` containing files changed, tests run, results, and concerns. Return only status, commit hash if any, one-line test summary, and concerns.
