# Collegiate microsite foundation

Implement the shared, host-aware collegiate microsite foundation described in the approved plan.

**Inspect first:** `src/lib/tenant/resolve-chapter.ts`, `src/lib/tenant/get-chapter.ts`, `src/lib/tenant/constants.ts`, `src/proxy.ts`, `src/app/(public)/layout.tsx`, `src/components/public/`, and current Supabase chapter schema/types.

**Deliverables:**

- Extend the typed tenant/site context so the resolved chapter includes `siteType`, `slug`, `name`, and safe branding defaults without breaking root-host behavior.
- Create `src/components/collegiate/collegiate-shell.tsx` and `src/components/collegiate/collegiate-home.tsx` as reusable, data-driven presentational components using the existing public visual system.
- Create `src/app/(public)/collegiate/page.tsx` as a server-rendered route that loads the current chapter and renders the shared template only for collegiate tenants; root/graduate tenant should continue using the existing homepage.
- Keep host parsing server-side through the existing proxy/header seam; do not parse `window.location` in client code.
- Add focused tests or type-level checks if no test runner exists.

**Constraints:** Do not add a duplicate site per chapter. Do not invent social URLs. Do not make unknown hosts expose another chapter’s content. Preserve unrelated changes.

Write a report to `.superpowers/sdd/2026-08-17-collegiate-microsite-report.md`. Return only status, one-line test summary, and concerns.
