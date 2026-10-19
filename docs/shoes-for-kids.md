# Shoes for Kids — Adopt a Pair

## Implementation plan and repository fit

This site uses Next.js App Router, Supabase Auth/Postgres, Sanity for editorial content, Resend for transactional mail, and Vercel Cron. The portal follows those existing systems. The original brief mentioned Firebase, Firestore, and Netlify; the site does not use them, and the owner confirmed that the current stack should be retained.

1. The SQL migration creates a draft 2026 campaign and private campaign tables.
2. The public page reads a deliberately anonymous projection from the server. Both adoption tabs reserve the same `shoe_requests` rows through one PostgreSQL transaction.
3. The existing member admin area manages campaign settings, imports, check-in, purchases, distribution, staff roles, and verified Zeffy CSV records.
4. A Vercel Cron releases expired physical reservations daily. The reservation transaction also releases overdue items if the scheduled job is late.

The migration was applied to the connected `birmingham-site` Supabase project on October 19, 2026. The 2026 shoe adoption campaign was published that day with 36 anonymous requests from the first Glen Iris list. The active Zeffy donation URL remains configured. The original school list has 81 entries; 45 without sizes are waiting for an updated list. The sponsor confirmation uses the existing Resend setup, and two program notice recipients are configured in Vercel production.

## Database and security

Migration: `supabase/migrations/20261019155341_shoes_for_kids.sql`.

Tables: `shoe_campaigns`, `shoe_requests`, `shoe_sponsors`, `shoe_reservations`, `shoe_reservation_items`, `shoe_receipts`, `shoe_donations`, `shoe_allocations`, `shoe_purchases`, `shoe_distributions`, `shoe_audit_logs`, and `shoe_staff_roles`. All enable RLS and revoke table access from `anon` and `authenticated`. Only server code using the existing service-role client reads or writes these tables. A public response contains only anonymous request ID, size, width, type, availability, campaign settings, and aggregate progress. School codes, external references, purchase notes, sponsor details, and donor references never appear in the public response.

The migration adds partial and lookup indexes for available requests, expiration, donations, distribution, and audit history. `shoe_reserve` locks request rows and fails the whole transaction if any selection is unavailable. `shoe_check_in`, cancellation, extension, import, purchase, distribution, and allocation are database functions granted only to `service_role`. Next.js Server Actions recheck the existing Supabase member session, chapter scope, MFA, and campaign role for every privileged mutation.

The default campaign is `sfk-2026`, Draft, with a December 11, 2026 11:59 p.m. America/Chicago physical deadline and seven-day reservations. It is inserted only when a `root` chapter row exists when the migration runs. If that chapter does not yet exist, create the campaign in the admin screen after provisioning the chapter. Do not publish until imported requests, the confirmed drop-off or committee handoff process, and donation configuration have been checked.

**Metric definitions:** requested excludes cancelled request records. Fulfilled counts requests received, purchased, or distributed once each. Received and purchased totals follow their respective timestamps, including pairs later distributed. Reserved counts active physical commitments only. Outstanding is requested minus fulfilled, even when an item is reserved. Net verified donations are successful imported amounts less recorded refunds; funds allocated to requests do not count as shoes physically fulfilled.

## Deploy and activate

1. The Shoes for Kids migration is applied to the connected `birmingham-site` Supabase project as version `20261019155341`. Confirm this is the database used by the deployment. Do not run tests against production data.
2. Ensure the existing `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CHAPTER_SLUG_MAP`, `NEXT_PUBLIC_SITE_URL`, and `CRON_SECRET` settings are present in the Vercel environment. The existing `request_rate_limit_windows` migration must also be applied for public reservation abuse protection. `RESEND_API_KEY` and `EMAIL_FROM` enable sponsor confirmation emails. Reservation notices go to `CHAPTER_FORM_EMAIL` and the Social Action recipient in `SOCIAL_ACTION_DIRECTOR_EMAIL`. No new client-side secret is needed.
3. Deploy the Next.js app and Vercel Cron configuration. Confirm `/api/cron/expire-shoe-reservations` responds only to Vercel's authenticated cron request.
4. Sign in as a Tau Sigma super admin or chapter admin with MFA. Open `/admin/shoes-for-kids`. Configure the confirmed drop-off location, hours, contact, instructions, dates, and Zeffy link. If drop-off has not been confirmed, the sponsor form offers only committee-coordinated handoff. A super admin can assign existing approved member IDs to director, committee, finance, or distribution roles. A chapter admin without an explicit assignment acts as campaign director. Finance functions require a finance assignment or super admin.
5. Import an anonymous school list, inspect the preview and results, test a reservation in a nonproduction environment, then publish the campaign. The public route is `/shoes-for-kids`; the legacy community-event URL redirects there.

The app's `serverActions.bodySizeLimit` is 3 MB for the import form. Each CSV/XLSX file is separately limited to 2 MB and 500 fulfillable pairs per batch. The XLSX reader processes the first worksheet, shared strings and inline strings, never evaluates formulas or external links, and rejects oversized ZIP contents.

## Administrator workflow

### School requests

Provide CSV or XLSX with the columns:

`External Request Reference, School Code, Grade Level, Gender, Shoe Size System, Shoe Size, Shoe Width, Shoe Type, Quantity, Optional Approved Purchase Notes`

Accepted grades are Pre-K, Kindergarten, and 1st through 5th Grade. Gender accepts Boy, Girl, or Not specified. These two columns are optional for older files; when present they are shown to sponsors with size, width, and shoe type. Accepted size systems are `toddler`, `little-kid`, `youth`, and `adult`; widths are `standard`, `wide`, `extra-wide`, and `narrow`. Use a numeric US size such as `4` or `4.5`. Each quantity expands into individual request records. Reimporting an external reference updates an available record; an already reserved or fulfilled record is skipped. Keep the private child-to-reference mapping outside this portal. Never upload student names, birth dates, school IDs, addresses, or private circumstances.

When a school cannot provide stable anonymous IDs, the committee assigns IDs in a private working list and maintains a separate, protected name-to-ID crosswalk. Match each revised list against that crosswalk before importing. Keep the same ID for each returning request, assign new IDs only to new requests, and review changed spellings manually. A row missing from a later import is not deleted automatically. Abbreviated names may appear in the staff working list but must be omitted from the import file and public portal.

For the first Glen Iris import, the owner approved interpreting the school's 9–13 “youth” labels as little-kid sizes, 1–4 “child” and 4 “youth” as youth sizes, and “women” as adult women's sizes. The eight women's requests use the shoe type “Women's athletic shoes” so the public label is unambiguous. All 36 imported rows use standard width because the school supplied no width values; verify that assumption against the updated list and reimport corrections while requests are available. New athletic shoes are required, with kid-friendly styles encouraged. The public page offers committee-coordinated handoff until a drop-off location is confirmed.

### Reservations and physical shoes

Sponsors may reserve up to 20 pairs as an individual or organization. The management link uses a random 256-bit token stored only as a SHA-256 hash and expires 30 days after the reservation deadline. Save or print the confirmation if email is unavailable. The sponsor confirmation email is sent only when Resend is configured and confirms acceptance. A separate notice goes to the configured program addresses with the reservation reference and sponsor contact details, but no management token or student identity. An email failure does not undo an accepted reservation. A separate QR code contains only an opaque random reservation UUID with an `SFK-CI:` prefix. It identifies the reservation for signed-in staff but grants no sponsor-management or check-in authority by itself.

The committee can search the recent reservation list, look up an older reservation by reference, or scan its QR with a browser camera over HTTPS. They can extend deadlines within the campaign deadline, cancel remaining unfulfilled items, and check in each pair. Accepted pairs require size, width, and type verification. Damaged or incompatible pairs require an exception note. Partial check-in never marks the other items received. Finance staff can record a chapter purchase and actual cost for an available request, optionally against a prior allocation. Distribution staff can record delivery only for received or purchased pairs, with a school delivery reference.

### Zeffy

In Zeffy, retrieve the approved campaign sharing URL and, if using an iframe, the official embed URL. Enter both in the campaign manager. The app accepts only HTTPS `zeffy.com` hosts and always offers the external Zeffy page as a fallback. The current Zeffy documentation describes [campaign embeds](https://support.zeffy.com/how-to-embed-your-zeffy-campaign-on-your-website-km0gv), a [read-only API and webhooks](https://support.zeffy.com/get-started-with-the-zeffy-api-yourg), but this repository has no Zeffy credentials, campaign ID, verified webhook secret, or account-level confirmation. Automated synchronization is intentionally disabled. Zeffy remains authoritative for completed transactions.

Finance staff should export and verify transactions in Zeffy, normalize the CSV to:

`Zeffy Transaction ID, Amount USD, Refunded USD, Currency, Status, Donor Reference, Paid At`

Use ISO 8601 for `Paid At` and `USD` for currency. Supported statuses are `succeeded`, `pending`, `failed`, `refunded`, `partially_refunded`, and `review`. Transaction IDs are unique within a campaign, so reimports update the existing record rather than double-count it. Finance staff can allocate verified net funds to a request or general fund. A funding allocation does not mark a pair received or purchased. Review unmatched and refunded transactions before allocation.

## Current limits and follow-up work

- The 2026 campaign is published with 36 sized requests from the first Glen Iris list. The 45 entries lacking sizes remain out of the public inventory. Match the next school list against the private stable-ID crosswalk before importing additions or corrections.
- API/webhook reconciliation requires Zeffy account credentials and verification details; the implemented path is manual CSV reconciliation.
- Resend confirmation uses the site's existing configured provider. Reminder, thank-you, cancellation, and donation emails are not yet automated.
- Check-in supports QR camera scanning, reference lookup, and manual item selection. Camera access requires HTTPS and browser permission; the printed reference remains a fallback.
- The reservation list displays the most recent 100 entries. Staff can look up older reservations by exact reference for check-in. Bulk reservation pagination and reassignment to another sponsor are not yet implemented.
- XLSX import accepts the first worksheet and common cell encodings. Complex workbook layouts should be exported to the documented CSV format.
- Distribution records, CSV request reports, and ready-pair school manifests are available. PDF export is not yet implemented.
- Data retention and deletion should be set with the Foundation's legal and school partners before historical sponsor or donor records are purged. No automatic deletion is enabled.

Tests run locally against an isolated PGlite database. They exercise reservation conflicts, shared inventory, atomic multi-size selection, expiration, partial check-in, funding, purchase, distribution, and import validation. Production Firestore or Supabase data is never used for these tests.
