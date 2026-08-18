# Resend Setup

The site already uses the verified `mail.birminghamsigmas.org` sending
subdomain for transactional mail. Task 2's intake notifications expect these
server-only environment variables:

- `RESEND_API_KEY`: Resend API key for server-side delivery only. Do not use a
  `NEXT_PUBLIC_` prefix.
- `EMAIL_FROM`: sender address under the verified domain. The default is
  `notifications@mail.birminghamsigmas.org`.
- `INTAKE_ADMIN_EMAIL`: chapter recipient for public membership-interest,
  transfer, and reactivation notifications.

The intake flow sends two best-effort messages after a successful
`prospective_members` insert:

- an applicant receipt confirming the submission was received
- an admin notification to the configured chapter recipient

Delivery failures never roll back the saved form submission. If the chapter
name lookup fails, the emails still send with a neutral chapter fallback.
