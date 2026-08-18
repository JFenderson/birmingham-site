# Root Chapter Member Access and Interest Forms

## Scope

Implement member access for the root Tau Sigma chapter only. Collegiate chapter sites remain public-only for now and must not expose or authorize the root member system.

## Interest forms

Interest forms are outreach submissions, not account applications. The existing `prospective_members` table remains the storage location and receives a typed submission:

- `membership_interest`
- `transfer`
- `reactivation`

Submitting a form does not create a Supabase Auth user, profile, or chapter membership. The submitter receives a receipt email through Resend, and the configured administrator recipient receives a notification email. All fields are validated, length-limited, rate-limited, safely rendered, and stored through parameterized Supabase queries.

The public label “New Member Intake” becomes “Membership Interest.”

## Root member access

The root public site displays a Brothers login link and a “Request Member Access” action. Collegiate tenants hide these links and server-side authorization rejects root-member routes outside the root tenant.

There are two account creation paths:

1. A brother verifies `membership_number + last_name` against the root roster and supplies a preferred email address. The email does not need to match the roster email. The system responds neutrally to prevent roster enumeration, rate-limits attempts, verifies the preferred email, and creates a pending account/profile when the verification flow succeeds.
2. An administrator sends a Supabase invitation to a brother who does not know their membership number. The invitation creates the Auth account and profile and allows the brother to set a password. The account still requires administrator approval before portal access.

Membership numbers are identifiers, never passwords or security tokens. Passwords, email verification, sessions, and invitation tokens remain managed by Supabase Auth.

## Roster

The supplied roster is root/Tau Sigma data. It will be imported into a protected roster table with chapter association and a unique membership number. Only the fields needed for verification and administration should be retained where possible. The source workbook must not be committed to Git or exposed through the application.

Roster records are linked to at most one Supabase user through a claim field. RLS prevents public reads; verification occurs through a narrow server-side operation that returns only a neutral result.

## Authorization

The existing profile authorization fields remain the coarse access boundary:

- `pending`, `approved`, `suspended`
- `member`, `chapter_admin`, `super_admin`

Members require an approved profile and root chapter scope. Chapter administrators require approved status, root scope, and MFA. Super administrators require approved status and MFA and are globally scoped. The existing MFA system is reused and extended to the newer admin authorization path; no second MFA system is introduced.

The legacy `chapter_members` officer roles remain available for existing officer-specific capabilities during migration, but new root member approval and administration use the profile-based boundary.

## Email

Resend is already provisioned at the account level, with `birminghamsigmas.org` connected through `mail.birminghamsigmas.org`. Implementation should reuse that verified Resend setup rather than redesigning domain authentication. The remaining work is to choose the application sender address under the verified domain, add the server-only API key and sender configuration to local/Vercel environments, create the interest-form receipt and administrator notification templates, and handle delivery errors. Supabase Auth remains responsible for account invitations, password setup, email verification, sessions, and recovery.

## Security and testing

All public inputs use schema validation and bounded lengths. React-rendered values remain text, not injected HTML. No user input is interpolated into SQL or email HTML without escaping. Public endpoints use rate limiting and neutral responses. Server actions re-check authentication, tenant scope, role, and MFA; UI visibility is not treated as authorization. Tests cover form types, root-only access, roster verification, neutral lookup responses, pending approval, invitation fallback, admin MFA, RLS-sensitive updates, and Resend failure handling.

## Out of scope

- Collegiate member login or collegiate rosters.
- Automatic membership approval without administrator review.
- Using membership numbers as passwords.
- Replacing Supabase Auth with Resend.
- Importing the original workbook into GitHub or public storage.
