# Member sign-in rollout

Members can choose an emailed sign-in link or their existing password. The sign-in action sets shouldCreateUser=false: it does not create accounts or grant approval. The portal verifies approved chapter membership independently of the authentication method.

Officers can browse ordinary member content at AAL1. Officer actions (including Secretary tools), applicant records, other people's transactions and restricted vault records require AAL2. The database migration enforces this for direct API callers as well. Personal payments and check-ins remain normal member operations.

## Required deployment configuration

1. Test and apply `supabase/migrations/20260914000000_member_sign_in_step_up.sql` before releasing the new portal access behavior. Enable TOTP enrollment/verification in the hosted Supabase project first and ensure administrators have a working factor/recovery process. Local config enables TOTP; it does not change hosted settings.
2. Set NEXT_PUBLIC_SITE_URL to the intended member login origin. Add its exact `/auth/sign-in` URL to the hosted Auth redirect allowlist. With multiple chapter hosts, configure the intended origin per deployment; do not accept arbitrary return URLs from requests.
3. Copy `supabase/templates/magic-link.html` into Supabase Auth's Magic Link email template. The token-hash confirmation supports opening email on a different browser/device. The default provider PKCE redirect is also supported but requires the requesting browser. Neither GET page visits nor email-link scanning consume the token: the member presses a confirmation button.
4. Set a short email OTP/link lifetime (suggested 15 minutes), retain provider email throttles and configure reliable SMTP. Configure Upstash for application limits; missing/unavailable Redis intentionally blocks link requests. The app uses a neutral response for unknown account emails.
5. Keep secure password change enabled in hosted Auth. The password action now uses the user-scoped API and requires enrolled MFA to be satisfied. Pending invitees can continue without creating a password, but remain blocked from member data until approved.
6. Configure bounded Auth session lifetime/inactivity in the hosted project according to available plan settings. Suggested starting point: seven-day maximum, with shorter inactivity for shared-device use. This change preserves existing Supabase cookie persistence; it does not add a misleading “remember me” checkbox or claim to enforce a timeout through cookie expiry alone. No new link is needed for each page visit.

## Release verification

- Approved Member: password and email link both reach the dashboard; no authenticator setup prompt.
- Pending/suspended account and wrong chapter: cannot access member pages or data, even with an existing legacy officer membership.
- Unknown email: neutral response and no user creation.
- Email link: same/different browser with custom template; expired, reused, missing and malformed token; GET/prefetch must not consume a link; existing invite/recovery flows still work.
- Each officer at AAL1: dashboard/events/personal payments/general documents available; protected tools prompt for MFA; applicant/financial/restricted-document API reads and officer writes denied.
- Each officer at AAL2: permitted functions work, with original role/chapter restrictions intact. A Secretary cannot self-promote through the direct API.
- Verify storage signed URLs as well as table reads: previously issued URLs may remain usable until they expire.

These files prepare the change; hosted Auth settings, email templates and migrations must be deployed separately. The other findings in the input-security review remain a separate remediation backlog.
