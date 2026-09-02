# Initiative Tracker Design

## Goal

Add a no-login initiative tracker to the Birmingham Sigmas site for Black Spending and daily steps.

## Behavior

Visitors choose an initiative, submit their name and evidence, and receive an automatically approved submission. Names are stored privately; public rankings render first initial plus last name. A private director dashboard provides month filters, totals, cleanup, and CSV downloads.

Black Spending records business name, Black-owned confirmation, amount, date, time spent, and receipt image. Steps records date, step count, optional distance, duration/time range, and screenshot.

## Architecture

Use Supabase tables and a private `initiative-evidence` storage bucket. Server Actions validate inputs, enforce a honeypot and rate limit, upload evidence, and insert rows through the service-role client. Public pages query only approved aggregate/ranking data. Directors use existing authenticated chapter-admin authorization.

## Privacy and abuse controls

No public full names or evidence URLs. The client receives a private edit/delete token after submission; directors can remove or correct records. Validate MIME type and size, use generated storage paths, and apply server-side limits. Automatic approval is intentional, with cleanup as the moderation model.

## Reporting

Monthly totals include submission count and initiative-specific measures. CSV exports include director-useful fields and full names, but are access-controlled.
