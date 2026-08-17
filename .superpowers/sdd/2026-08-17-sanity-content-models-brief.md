# Sanity content models and public events

Implement Sanity-managed public content for community events, programs, and leadership.

Read first: `src/sanity/schema/post.ts`, `sanity.config.ts`, `src/sanity/client.ts`, `src/app/(public)/community-events/page.tsx`, `src/app/(public)/about/programs/page.tsx`, `src/app/(public)/about/leadership/page.tsx`, and `src/lib/tenant/get-chapter.ts`.

Deliver:

- Create Sanity schemas `event.ts`, `program.ts`, and `leader.ts`, each tenant-scoped by `chapterSlug`, with required title/name, description/role fields, ordering, and publication/publishedAt fields where appropriate.
- Register all schemas in `sanity.config.ts` so they appear in `/studio`.
- Add typed fetch helpers under `src/sanity/queries.ts` using the existing `sanityClient` and current chapter slug.
- Update public Community Events, Programs, and Leadership pages to fetch published Sanity content with graceful empty/error fallback. Keep existing hardcoded content as fallback when the CMS has no records, so the site remains populated before editors enter data.
- Preserve tenant filtering; root content must not appear on collegiate hosts.
- Run TypeScript, ESLint, and diff checks.
- Do not change Supabase tables or portal routes.

Write `.superpowers/sdd/2026-08-17-sanity-content-models-report.md` and return only status, tests, and concerns.
