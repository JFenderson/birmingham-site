# Sigma Beta Club and Tau Sigma Charity Foundation Design

## Goal

Add two public, chapter-scoped areas without changing the existing public layout: a Sigma Beta Club page for youth-program information and interest, and a Tau Sigma Charity Foundation page for nonprofit information, projects, board members, donations, and information requests.

## Content ownership

Sanity owns public editorial content: overviews, events, projects, board/advisor listings, images, and links. Supabase remains the system of record for private member data. Interest and information-request forms are public contact workflows; they do not create accounts or write to Supabase auth. Resend sends the submitter confirmation and the designated chapter/foundation notification.

## Routes

- `/sigma-beta-club`
- `/foundation`

Both routes resolve the current chapter through `getCurrentChapter()` and query Sanity by `chapterSlug`. They render chapter-neutral empty states when content is not configured. Existing `/`, `/about`, `/community-events`, `/photos`, `/media`, and portal routes remain unchanged.

## Sanity documents

- `sigmaBetaSettings`: chapter slug, published state, overview, mission, hero image, director contact label/email/phone, advisor list reference or embedded advisor records, and interest-form intro.
- `sigmaBetaEvent`: chapter slug, title, slug, description, event date, location, registration URL, image with required alt text, published state/date.
- `foundationSettings`: chapter slug, published state/date, nonprofit name, 501(c)(3) statement, purpose, overview, donation URL, information-request intro, contact email, and hero image with required alt text.
- `foundationProject`: chapter slug, title, description, date, project type, image/gallery references, and published state/date.
- `foundationEvent`: chapter slug, title, description, date, location, registration URL, and published state/date.
- `foundationBoardMember`: chapter slug, name, role, bio, portrait with required alt text, display order, and published state.

All public queries must exclude drafts, require `published == true`, require `publishedAt <= now()` where applicable, filter by chapter slug, and end ordering with `_id asc`. All public images require nonblank alt text at schema and rendering boundaries. Donation and registration links accept only internal paths or HTTPS URLs; unsafe schemes are rejected and omitted at runtime.

## Forms and notifications

Sigma Beta interest submissions and foundation information requests use server-side actions/API routes with Zod validation, honeypot/rate-limit protections already used by the public forms, and Resend notifications. They return a neutral success message and never create member accounts. The recipient address is server-only environment configuration, not a Sanity field.

## Donations

The Foundation page displays a Sanity-managed donation button URL. Payment processing remains outside Sanity and must use the existing approved Square/external donation flow. No payment credentials or service-role keys enter Sanity or client code.

## Accessibility and security

Use existing page headers, cards, CTA, empty-state, and media components. Every form has labels, keyboard-accessible controls, validation messages, and a success state. Sanity content is treated as untrusted: links are sanitized, rich text is rendered through approved Portable Text components, and public queries are draft-safe and tenant-scoped.
