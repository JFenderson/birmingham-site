# Status

- Implemented tenant-scoped Sanity schemas for community events, programs, and leaders and registered them in `/studio`.
- Added typed, published-content query helpers with strict `chapterSlug` equality, ordering, scheduled event publication, and error-to-empty-list handling.
- Updated Community Events, Programs, and Leadership public pages to use Sanity records while preserving their existing hardcoded content whenever the CMS is empty or unavailable.
- Added query contract tests covering tenant isolation, publication filters, ordering, returned records, and Sanity failure handling.
- No Supabase tables or portal routes were changed.

# Tests

- `node --test tests\tenant\site-context.test.ts tests\tenant\resolve-tenant.test.ts tests\admin\member-management.test.ts tests\sanity\content-queries.test.ts` — passed, 21/21 tests.
- `.\node_modules\.bin\tsc.cmd --noEmit` — passed.
- `.\node_modules\.bin\eslint.cmd .` — passed with 0 errors and one existing warning in `tailwind.config.ts`.
- `git diff --check` — passed; Git emitted line-ending normalization warnings only.

# Concerns

- The machine-level `npm` launcher is broken because its global `npm-cli.js` is missing, so TypeScript and ESLint were run through the repository-local binaries instead.
- No live Sanity dataset request was made; query behavior was verified with a recording client and the existing client configuration was type-checked.
- The schema chapter selector currently lists `root` and `miles`, matching the existing post schema; it must stay synchronized if `CHAPTER_SLUG_MAP` gains more chapters.
