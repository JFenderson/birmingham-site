# Member Invite & Onboarding — Design

**Status:** Approved by human partner. Implemented, then corrected post-implementation
after the final whole-branch review found the "Accept-invite flow" and "Provisioning
order" sections below described a mechanism Supabase does not actually support (see
2026-08-05 correction inline). Corrected sections are marked **[CORRECTED 2026-08-05]**.

## Problem

Member account creation (a brother getting an actual login to the portal) does
not exist anywhere in this codebase. `src/app/(public)/login/page.tsx` is
sign-in only. The intake pipeline (`src/app/(portal)/intake/**`) moves a
`prospective_members` row through pipeline stages and lets officers leave
notes, but never creates the person's `auth.users` account or their
`chapter_members` row. Today, account creation is a manual, out-of-app step
(an admin using the Supabase dashboard's "Invite user," or an ad hoc script
call to `supabase.auth.admin.inviteUserByEmail()`).

This is a real onboarding gap, separate from Phases A–F (vault, MFA,
payments, transactional email, rate limiting, CMS), which never touched
member provisioning.

## Goal

An Admin, Secretary, or Intake Director can invite someone to the portal —
either directly (a standalone form) or from an approved intake application
(pre-filled) — and that person receives an email, sets a password, and lands
in the portal as a `Member`.

## Non-goals

- Role selection at invite time. Every invite creates a `Member`; promoting
  someone to an officer role happens separately, outside this feature.
- A new migration or schema change. Duplicate-invite detection reuses
  Supabase's own "user already exists" error rather than a tracking column.
- Bulk-inviting already-approved historical applicants. Natural usage going
  forward is sufficient; no backfill script.
- Resend integration. This feature uses Supabase Auth's own invite email
  (via Supabase Auth SMTP), not the `resend` npm package Phase D built for
  app-level transactional email. These are two separate email paths that
  happen to be able to share one sending domain.

## New infra dependency

Same shape as the Square/Resend/Upstash dependencies from Phases C–E:
**Supabase Auth SMTP must be configured** (Project Settings → Auth → SMTP
Settings) before invite emails reliably deliver — Supabase's built-in sender
is rate-limited and explicitly not for production use. This can reuse the
same Resend account/domain from Phase D via Resend's SMTP credentials (a
separate credential from the Phase D `RESEND_API_KEY`, which is API-only).
Flag this to the user the same way prior phases flagged their credential
dependencies. **[Added 2026-08-05]** Two more one-time setup steps, uncovered
by the final review: the deployed Supabase project's redirect URL allow-list
must include every chapter subdomain's `/auth/confirm` path, and the invite
email template must be customized (see "Accept-invite flow" below) — neither
is optional, both are required for the accept-invite flow to function at
all, not just to "deliver reliably" like SMTP. The live smoke test for this feature is deferred until SMTP is
configured, same pattern as Phases C/D/E's deferred live tests.

## Architecture

### Entry points (both call the same Server Action)

1. **Standalone invite** — `src/app/(portal)/members/invite/page.tsx`.
   Visible only to Admin/Secretary/Intake Director (role-gated nav link,
   same pattern as `canUpload` in `src/app/(portal)/vault/page.tsx`, not
   visible-to-all like Vault/Pay/Events). Form: full name + email. Submits
   to `inviteMember({ chapterId (server-resolved), fullName, email })`.

2. **Intake-triggered invite** — an "Invite to Portal" button on
   `src/app/(portal)/intake/[id]/page.tsx`, shown only when
   `prospective_members.pipeline_stage === 'approved'`. Pre-fills
   `fullName`/`email` from that row. Calls the same `inviteMember` action.

### Shared Server Action

`src/app/(portal)/members/invite/actions.ts`:

```
export async function inviteMember(input: {
  fullName: string;
  email: string;
}): Promise<{ error: string | null }>
```

- First line: `requireRole(["Admin", "Secretary", "Intake Director"])` —
  resolves `chapterId` server-side, never trusts a client-supplied one (same
  constraint as every other Server Action in this codebase).
- Re-validates `input` against a new `inviteMemberSchema` in
  `src/lib/validation/schemas.ts` (full name non-empty, email valid).
- Delegates to a `src/lib/**` wrapper (service-role boundary, same pattern
  as every prior phase): `src/lib/members/invite-member.ts`.

### Service-role wrapper

`src/lib/members/invite-member.ts` exports:

```
export async function provisionMemberInvite(params: {
  chapterId: string;
  fullName: string;
  email: string;
}): Promise<{ error: string | null }>
```

**[CORRECTED 2026-08-05]** Provisioning order (mirrors the vault upload's
"clean up the orphan on partial failure" pattern from
`src/lib/vault/record-document.ts` — with one correction: on step 2 failure,
prefer leaving a recoverable orphaned account over an irreversible delete,
see below):

1. Compute the invite's `redirectTo` as the **requesting officer's own
   tenant host** (e.g. `https://miles.lvh.me:3000/auth/confirm`, not a
   single global `NEXT_PUBLIC_SITE_URL`) — derived from the inbound
   request's `Host` header inside the Server Action, the same way
   `proxy.ts` derives tenant context from the host. This matters because
   Supabase Auth's session cookie is host-scoped: if the confirm/accept
   flow ran on a different host than the invited member's actual chapter
   subdomain, the session set during confirmation would not be sent on
   the subsequent page load, and the member would appear logged out.
2. Call `admin.auth.admin.inviteUserByEmail(email, { data: { full_name },
   redirectTo })`.
   - If this errors because the user already exists, return a friendly
     `{ error: "This person already has an account." }` — this IS the
     duplicate-invite check; no separate tracking state needed.
   - The existing `handle_new_user` trigger
     (`00000000000003_profiles.sql`) auto-creates the `profiles` row from
     `raw_user_meta_data ->> 'full_name'` the moment the auth user is
     created — no separate profile-insert step needed here.
3. Insert the `chapter_members` row (`chapter_id`, `profile_id` = the
   invited user's id, `role: 'Member'`) using the admin client (this insert
   is what actually needs the service-role client — the officer's own
   session doesn't have an insert policy broad enough here, and using the
   admin client keeps this consistent with the rest of the codebase's
   privileged-write pattern).
4. **If step 3 fails with a unique-violation** (the `(chapter_id,
   profile_id)` constraint — meaning this person was already invited to
   this chapter and Supabase re-issued the invite to the same pending
   user rather than erroring): return a friendly "This person has already
   been invited." error. **Do not delete the auth user** — the original
   design's "delete the orphaned user on any step-3 failure" was flagged
   in the final review as destructive-by-default: an officer re-clicking
   "Invite" (the ordinary recovery action when an email doesn't arrive,
   which is exactly the situation before Auth SMTP is configured) would
   silently delete the pending invitee's account, cascading their profile
   and any other chapter memberships. For any *other* unexpected step-3
   failure, log loudly with the `userId` for manual reconciliation and
   leave the account in place — a recoverable orphan is preferable to an
   irreversible deletion.

### Accept-invite flow **[CORRECTED 2026-08-05]**

The original design assumed Supabase's invite email links to `redirectTo`
with a PKCE `?code=` param, exchanged via `exchangeCodeForSession()`. This
is factually wrong: Supabase's own SDK documents that **PKCE is not
supported for `inviteUserByEmail`** (the browser that sends the invite and
the browser that accepts it are different browsers, so there's no local
PKCE verifier to match against). The corrected mechanism uses an OTP
token hash instead, consumed via `verifyOtp()`:

1. **Custom invite email template** (`supabase/templates/invite.html`,
   registered via `[auth.email.template.invite]` in `supabase/config.toml`
   for local dev, and the equivalent Authentication → Email Templates →
   "Invite user" setting in the deployed Supabase project's dashboard) —
   overrides Supabase's default template so the link points directly at
   this app's own confirm route rather than Supabase's hosted verify
   endpoint: `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=invite`.
   Since `redirectTo` (computed in step 1 above) is already a full URL
   with its own `?next=...` query string, the template appends with `&`,
   not `?`.
2. **`src/app/auth/confirm/route.ts`** (new, small server route) — reads
   `token_hash`, `type`, and `next` from the query string, calls
   `supabase.auth.verifyOtp({ type: "invite", token_hash })` (establishes
   the session server-side via `@supabase/ssr`'s cookie handling, on
   whatever host actually received the request — i.e. the correct chapter
   subdomain, per the redirectTo fix above), then redirects to a validated
   `next` (`/accept-invite`; same-origin-relative-path validation from the
   already-fixed open-redirect finding still applies). On failure
   (expired/invalid token), redirects to `/login?error=invite-expired`.
3. **`src/app/(public)/accept-invite/page.tsx`** (new) — a client component.
   Confirms a session exists (redirect to `/login` if not — guards against
   someone hitting this URL directly with no active invite session). Shows
   a "set your password" form; submits via `supabase.auth.updateUser({
   password })`; on success, `router.replace("/dashboard")`.

**New required setup steps** (same shape as the Auth SMTP dependency
already documented above): the deployed Supabase project's redirect URL
allow-list (Authentication → URL Configuration → Redirect URLs) must
include every chapter subdomain's `/auth/confirm` path (a wildcard pattern
like `https://*.birminghamsigmas.org/auth/confirm` is supported there),
and the invite email template must be customized to match step 1 above.
Local `supabase/config.toml` is updated in the same commit as the code fix
so local dev testing (once SMTP is configured) matches production.

### Nav

Add an "Invite" link to `src/app/(portal)/layout.tsx`, gated to
Admin/Secretary/Intake Director only (conditional render, like the vault
page's upload button — not a plain always-visible link like Vault/Pay/
Events).

## Data flow summary

```
Officer (Admin/Secretary/Intake Director)
  -> /members/invite (standalone) OR /intake/[id] "Invite to Portal" button (pre-filled)
  -> inviteMember() Server Action
       -> requireRole() + zod validation
       -> provisionMemberInvite()
            -> redirectTo computed from the officer's own tenant host
            -> admin.auth.admin.inviteUserByEmail()  [triggers handle_new_user -> profiles row]
            -> insert chapter_members row (role: Member)
            -> on chapter_members unique-violation: friendly "already invited" error, no delete
            -> on other chapter_members failure: log loudly, leave the account (no delete)
  -> Supabase sends invite email (via configured Auth SMTP + custom invite template)
  -> Invited person clicks link -> /auth/confirm?token_hash=...&type=invite&next=/accept-invite
       -> verifyOtp({ type: "invite", token_hash }) -> redirect to validated next
  -> /accept-invite: set password -> supabase.auth.updateUser({ password })
  -> redirect to /dashboard, now signed in as a Member
```

## Error handling

- Duplicate invite (user already exists): friendly error, no rollback
  needed (nothing was created).
- `chapter_members` insert failure after a successful invite: roll back by
  deleting the auth user; return a generic "Could not complete invite,
  please try again" error.
- Expired/invalid invite code at `/auth/confirm`: redirect to
  `/login?error=invite-expired` with a visible message on the login page
  (small addition to the existing login page's error-display logic).
- `/accept-invite` visited with no active session: redirect to `/login`.

## Testing

No automated test suite exists in this repo (documented global constraint
from the Phase A–F plan) — same verification bar: `npx tsc --noEmit`,
`npm run build`, `npm run lint`, all clean. Live smoke test (a real invite
email arriving, accept flow working end-to-end) is deferred until Supabase
Auth SMTP is configured, same deferred-test pattern used for Phases C, D,
and E's external-account dependencies.

## Self-review notes

- No placeholders or TBDs remain — every step above has a concrete
  implementation shape.
- Internal consistency check: the `redirectTo` URL in step 1 of
  `provisionMemberInvite` and the route created in "Accept-invite flow"
  step 1 match (`/auth/confirm?next=/accept-invite`).
- Scope check: this is one cohesive feature (invite → accept → provisioned
  member), appropriately sized for a single implementation plan — it does
  not need further decomposition.
- Ambiguity check: "duplicate invite" was explicitly resolved to reuse
  Supabase's own existing-user error rather than a new tracking column,
  closing off what would otherwise be two valid readings of "already
  invited" (already has an account vs. previously sent an invite email
  that hasn't been accepted yet — this design only detects the former,
  which is an intentional scope decision, not an oversight).
