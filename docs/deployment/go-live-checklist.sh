#!/usr/bin/env bash
# Go-live setup checklist for birminghamsigmas.org, generated 2026-08-06.
#
# Most of what's left is manual work in third-party dashboards (creating
# accounts, generating API keys, clicking through DNS verification) — that
# can't be scripted. This file is a runnable CHECKLIST: each section prints
# what to do and where, and where possible, verifies the result once you've
# done it. Run sections independently as you complete each account, e.g.:
#
#   bash docs/deployment/go-live-checklist.sh square
#   bash docs/deployment/go-live-checklist.sh resend
#   bash docs/deployment/go-live-checklist.sh upstash
#   bash docs/deployment/go-live-checklist.sh sanity
#   bash docs/deployment/go-live-checklist.sh supabase-auth
#   bash docs/deployment/go-live-checklist.sh vercel-env
#   bash docs/deployment/go-live-checklist.sh verify   # checks .env.local against every section
#
# Run with no argument to print the whole checklist without verifying anything.

set -euo pipefail
cd "$(dirname "$0")/../.."   # repo root

ENV_FILE=".env.local"

check_var() {
  local name="$1"
  if [ -f "$ENV_FILE" ] && grep -qE "^${name}=.+" "$ENV_FILE"; then
    echo "  [x] ${name} is set in ${ENV_FILE}"
  else
    echo "  [ ] ${name} is NOT set in ${ENV_FILE}"
  fi
}

section_square() {
  cat <<'EOF'
=== Square (Phase C — payments) ===

1. Create a Square Developer account: https://squareup.com/signup
   Then create an Application in the Developer Dashboard:
   https://developer.squareup.com/apps

2. Start in SANDBOX mode. From the sandbox app's dashboard, collect:
   - SQUARE_ACCESS_TOKEN            (sandbox access token)
   - SQUARE_APPLICATION_ID          (sandbox app ID)
   - NEXT_PUBLIC_SQUARE_APP_ID      (same value as above)
   - SQUARE_LOCATION_ID             (sandbox test location, auto-created)
   - NEXT_PUBLIC_SQUARE_LOCATION_ID (same value as above)

3. Register a webhook subscription (sandbox app's Webhooks tab):
   - Subscribe to: payment.updated
   - Target URL:   https://<your-deploy-url>/api/webhooks/square
     (needs a reachable URL — ngrok tunnel or a Vercel preview deploy;
     localhost alone won't work since Square's servers must reach it)
   - Square gives you SQUARE_WEBHOOK_SIGNATURE_KEY at registration time.

4. Leave SQUARE_ENVIRONMENT=sandbox / NEXT_PUBLIC_SQUARE_ENVIRONMENT=sandbox
   until you're ready to go live with real payments — switching to
   production means generating production credentials and re-registering
   the webhook against the production endpoint.

Once done, add all of the above to .env.local, then re-run:
  bash docs/deployment/go-live-checklist.sh verify
EOF
}

section_resend() {
  cat <<'EOF'
=== Resend (Phase D — transactional email) ===

1. Create a Resend account: https://resend.com

2. Add birminghamsigmas.org (or a subdomain like mail.birminghamsigmas.org)
   as a sending domain, then add the SPF/DKIM/DMARC DNS records Resend
   gives you, at your domain registrar. Verification can take minutes to
   hours.

3. Once verified, generate RESEND_API_KEY from the API Keys page.

4. EMAIL_FROM defaults to notifications@mail.birminghamsigmas.org, which
   should match the verified mail.birminghamsigmas.org sending subdomain.
   Set INTAKE_ADMIN_EMAIL to the brother/officer address that should receive
   membership interest, transfer, and reactivation form notifications.
   Override EMAIL_FROM only when sending from a different, already-verified
   address.

5. Before domain verification finishes, you can test with Resend's sandbox
   mode, which only delivers to your own account email.

Once done, add RESEND_API_KEY, EMAIL_FROM, and INTAKE_ADMIN_EMAIL to .env.local.
EOF
}

section_upstash() {
  cat <<'EOF'
=== Upstash (Phase E — rate limiting) ===

1. Create a free Upstash account: https://upstash.com
   Then create a Redis database (pick a region close to your Vercel
   deployment region).

2. From the database's dashboard, under "REST API", copy:
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN

   If you use the Vercel Marketplace integration instead, Vercel injects
   these automatically — but double-check they land in ALL THREE Vercel
   environments (Production/Preview/Development), not just Production.

Once done, add both vars to .env.local.
EOF
}

section_sanity() {
  cat <<'EOF'
=== Sanity (Phase F — CMS) ===

1. Create a Sanity account and project: https://www.sanity.io/manage
   (or run `npx sanity init` from the repo root, which can create the
   project for you interactively).

2. Collect:
   - NEXT_PUBLIC_SANITY_PROJECT_ID
   - NEXT_PUBLIC_SANITY_DATASET       (usually "production")
   - SANITY_API_TOKEN                 (only needed once write-from-server
                                        code is added — not used yet)

3. Run the Studio locally once configured:
     npm run dev
     open http://lvh.me:3000/studio
   Create a chapter's slug list in src/sanity/schema/post.ts's
   `chapterSlug` dropdown if it doesn't already match your seeded
   chapters (currently hardcoded to ["root", "miles"] — see the code
   comment there).

Once done, add all three vars to .env.local.
EOF
}

section_supabase_auth() {
  cat <<'EOF'
=== Supabase Auth (member-invite feature) ===

This is NOT the same as Resend — it's Supabase's OWN separate email
system (GoTrue), used only for invite/magic-link/password-reset emails.
Three separate dashboard changes are required, all in your Supabase
project's dashboard (not local — production only; local config.toml
already has the dev-equivalent settings):

1. Custom SMTP (Project Settings → Auth → SMTP Settings)
   Supabase's built-in mailer is rate-limited and not for production use.
   Recommended: use Resend's SMTP credentials (separate from the
   RESEND_API_KEY used for Phase D's API-based sends — issued from
   Resend's dashboard under SMTP settings).

2. Invite email template (Authentication → Email Templates → "Invite user")
   Must be customized so the link points at this app's own confirm route
   instead of Supabase's default. Use the same content as
   supabase/templates/invite.html in this repo:
     {{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=invite

3. Redirect URL allow-list (Authentication → URL Configuration →
   Redirect URLs)
   Must include every chapter subdomain's /auth/confirm path. A wildcard
   works: https://*.birminghamsigmas.org/auth/confirm
   (plus the root domain's own /auth/confirm if root isn't covered by
   that wildcard).

None of this has an env var to check — it's dashboard-only configuration.
EOF
}

section_vercel_env() {
  cat <<'EOF'
=== Vercel: apply every var above ===

For EVERY variable collected in the sections above, add it in Vercel
project settings → Environment Variables, and check the box for ALL
THREE environments: Production, Preview, and Development — not just
Production. Several of the fixes made during implementation (Square's
SQUARE_ENVIRONMENT split, the tenant-aware invite redirect) specifically
exist because Preview deploys are a live target with their own env-var
scope, not just a mirror of Production.

Also confirm vercel.json's registered cron job (meeting reminders) shows
up under your Vercel project's Cron Jobs tab after your next deploy.
EOF
}

section_verify() {
  echo "=== Checking ${ENV_FILE} against every credential above ==="
  echo
  echo "-- Square --"
  for v in SQUARE_ACCESS_TOKEN SQUARE_APPLICATION_ID SQUARE_LOCATION_ID \
           SQUARE_WEBHOOK_SIGNATURE_KEY NEXT_PUBLIC_SQUARE_APP_ID \
           NEXT_PUBLIC_SQUARE_LOCATION_ID; do
    check_var "$v"
  done
  echo
  echo "-- Resend --"
  check_var RESEND_API_KEY
  echo
  echo "-- Upstash --"
  check_var UPSTASH_REDIS_REST_URL
  check_var UPSTASH_REDIS_REST_TOKEN
  echo
  echo "-- Sanity --"
  check_var NEXT_PUBLIC_SANITY_PROJECT_ID
  check_var NEXT_PUBLIC_SANITY_DATASET
  echo
  echo "-- Vercel Cron secret --"
  check_var CRON_SECRET
  echo
  echo "Note: Supabase Auth SMTP, the invite email template, and the"
  echo "redirect URL allow-list have no env var — verify those directly"
  echo "in the Supabase dashboard."
}

case "${1:-}" in
  square) section_square ;;
  resend) section_resend ;;
  upstash) section_upstash ;;
  sanity) section_sanity ;;
  supabase-auth) section_supabase_auth ;;
  vercel-env) section_vercel_env ;;
  verify) section_verify ;;
  "")
    section_square; echo
    section_resend; echo
    section_upstash; echo
    section_sanity; echo
    section_supabase_auth; echo
    section_vercel_env
    ;;
  *)
    echo "Unknown section: $1"
    echo "Usage: $0 [square|resend|upstash|sanity|supabase-auth|vercel-env|verify]"
    exit 1
    ;;
esac
