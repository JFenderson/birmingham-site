# Collegiate microsite foundation report

## Status

Implemented the collegiate microsite foundation in the current workspace while preserving pre-existing edits.

## Delivered

- Added a pure, server-side tenant resolver with normalized host handling, root/localhost/Vercel preview support, and a 404 response for unknown hosts.
- Added a typed `SiteContext` containing `siteType`, `slug`, `name`, chapter ID, and safe default branding.
- Hardened chapter lookup by matching both chapter ID and slug; only the configured root tenant receives a graduate-site fallback.
- Added reusable, data-driven `CollegiateShell` and `CollegiateHome` components using the current public design primitives.
- Added the server-rendered `/collegiate` route, restricted it to collegiate tenants, and made the public home page select the collegiate template by resolved `siteType` while retaining the existing graduate homepage.
- Made shared public header/footer copy tenant-aware without adding chapter-specific social links.
- Added focused hostname-resolution and site-context tests.

## Verification

- Focused tests: 8 passed, 0 failed (`node --experimental-strip-types --test tests/tenant/resolve-tenant.test.ts tests/tenant/site-context.test.ts`). Node emitted non-failing module-type performance warnings.
- TypeScript: passed (`.\\node_modules\\.bin\\tsc.cmd --noEmit`).
- ESLint: passed with 0 errors and 1 pre-existing warning in `tailwind.config.ts` (`import/no-anonymous-default-export`).
- Diff validation: passed (`git diff --check`).
- Production build: blocked because the sandbox could not fetch Inter and Plus Jakarta Sans from Google Fonts; Next.js stopped before completing the build.

## Concerns

- A full production-build pass still needs to be run in an environment with access to `fonts.googleapis.com`, or the existing Google fonts need to be vendored locally.
- Each collegiate host must have a matching slug/ID in `CHAPTER_SLUG_MAP` and a matching `chapters` row; mismatches intentionally fail closed rather than showing another chapter's content.
