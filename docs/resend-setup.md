# Resend Setup

The site uses the verified `mail.birminghamsigmas.org` sending subdomain for
transactional mail. Public program form notifications use these server-only
environment variables:

- `RESEND_API_KEY`: Resend API key for server-side delivery only. Do not use a
  `NEXT_PUBLIC_` prefix.
- `EMAIL_FROM`: sender address under the verified domain. The default is
  `notifications@mail.birminghamsigmas.org`.
- `CHAPTER_FORM_EMAIL`: chapter inbox for every public program form. Defaults to
  `tausigmapbs@gmail.com` when unset.
- `INTAKE_ADMIN_EMAIL`: intake administrator for membership interest, transfer,
  and reactivation.
- `EDUCATION_DIRECTOR_EMAIL`: scholarship applications.
- `BBB_DIRECTOR_EMAIL`: Black Spending initiative entries.
- `SOCIAL_ACTION_DIRECTOR_EMAIL`: Daily Steps entries and Shoes for Kids reservations.
- `SIGMA_BETA_ADMIN_EMAIL`: Sigma Beta Club interest.
- `FOUNDATION_ADMIN_EMAIL`: Foundation information requests.

Each successful public program submission sends a notice to the chapter inbox
and its matching program address. Duplicate addresses receive one copy. If a
program address is unset, the chapter inbox still receives the notice. The
intake flow also sends an applicant receipt after a successful
`prospective_members` insert:

- an applicant receipt confirming the submission was received
- an admin notification to the chapter and intake recipients

Delivery failures never roll back the saved form submission. If the chapter
name lookup fails, the emails still send with a neutral chapter fallback.
