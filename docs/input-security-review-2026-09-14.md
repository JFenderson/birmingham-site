# User input security review

Reviewed September 14, 2026. Scope: application source, server actions, route handlers, Supabase migrations/policies, storage paths, Sanity content schemas, and existing tests.

**Assessment: remediation is needed before treating these input paths as production-hardened.** Most website forms have useful validation, but several protections exist only in the website while the underlying Supabase API allows broader operations. Public uploads and password changes also need attention.

This is a static source review, not a live penetration test. Database findings describe the checked-in migrations; actual exposure depends on deployed migrations, table/function grants, and API configuration. No production data was accessed or modified. No application code was changed.

## Input inventory

Paths below are relative to the repository root; finding references include exact source locations.

| Area | Inputs and entry points | Existing protection / assessment |
|---|---|---|
| Login `/login` | Email, password, `redirect`, `error`; `src/app/(public)/login/page.tsx` | Supabase verifies credentials; safe local redirect helper. Brute-force controls depend on hosted Auth settings. |
| Forgot password `/login/forgot-password` | Email; `forgot-password-form.tsx` | Uses Supabase recovery and neutral response. Auth rate limits and redirect allowlist must be verified in production. |
| Invite acceptance and reset `/accept-invite`, `/reset-password` | New password; recovery code, token hash/type, access/refresh tokens in URL fragment | Auth verifies tokens; reset page clears token-bearing URL. Password action uses privileged Auth API: F4. |
| Auth confirmation `/auth/confirm` | `token_hash`, `type`, `code`, `next` | Supported token flows and local redirect handling; retain token-expiry/reuse tests. |
| MFA `/security/mfa` | TOTP code and factor challenge/enrollment | Supabase verification; privileged server helpers require AAL2. Direct database writes lack equivalent enforcement: F3. |
| Member request `/request-access` | Membership number, last name, full name, email | Bounded schema, neutral result, 5 requests/10 minutes/IP, roster match, atomic claim. Identity/claim caveat F12. |
| Join `/join` | Form type, name, email, phone, message; school, major, graduation year; previous chapter, years inactive | Server discriminated schema, tenant from proxy, fail-closed 5 requests/10 minutes/IP; service-role insert. Forwarded-header trust must be checked. |
| Sigma Beta `/sigma-beta-club` | Name, email, phone, student/guardian/other role, message, hidden website field | Server schema, honeypot, fail-closed rate limit, structured email rendering. Recipient ownership is not verified. |
| Foundation `/foundation` | Name, email, organization, phone, required message, honeypot | Server schema, honeypot, fail-closed rate limit, structured email rendering. Donation redirects are external HTTPS destinations, not a local card form. |
| Initiatives `/initiatives` | Initiative type, first/last names, business, spending amount/date, confirmation, steps/miles/date, hours/minutes, evidence file, honeypot | Schema, numeric bounds, MIME label/size checks, randomized path, private file bucket. Raw record disclosure, bypassable throttling and upload/content-integrity gaps: F1, F6, F7. |
| Scholarship `/community-events/scholarship` | Award name, legal name, email, phone, address, school, DOB, age, citizenship, race, ethnicity, GPA, intended major/school, essay, agreement, honeypot | Server schema, seasonal gate, private bucket/table. Seven files: transcript, resume, acceptance, recommendation, service proof, signed application, photograph. Missing throttling, file verification and rollback: F6–F7. |
| Events `/events/new` | Title, description, datetime, location name, latitude, longitude, radius | Officer role/MFA, bounded text/geofence values. Datetime insufficiently validated: F11. |
| Check-in `/events` | Event UUID and browser coordinates | Authenticated membership, tenant-scoped event lookup, range/distance check, duplicate prevention. Coordinates are assertions from the caller; no attendance time window: F10. |
| Payments `/pay` | Square card token, amount, payment category; action also accepts description | Square tokenization; bounded $1–$10,000 amount, enum, authenticated user/chapter, unique provider payment ID. No stable retry key or application throttling: F9. |
| Vault `/vault/upload`, `/vault` | File bytes/name, title, category, storage path; delete document ID; download bucket/path | Private storage, category checks, path prefix/traversal checks, scoped delete, 60-second signed downloads. Direct API metadata policy is broader; file controls incomplete: F5, F7. |
| Intake `/intake/[id]` | Applicant UUID, stage enum, note text | Action verifies applicant belongs to chapter; notes bounded to 2,000 characters. Direct note API can forge author/cross-chapter relationship: F5. |
| Invites `/members/invite` | Name, email, optional membership number | Server schema, approved chapter admin plus MFA, configured redirect origin; privileged provisioning. Add account/chapter invite quotas. |
| Member administration `/admin/members` | Member UUID, approval/suspension/restoration, role | Schema, tenant scoping, self-change rules and optimistic concurrency checks in actions. Database role protections differ: F2–F3; missing authorization-change audit: F8. |
| Account `/account` | No editable UI; direct profile API can update name, phone, avatar URL | Self-row RLS and authorization-field trigger. Direct safe-field updates bypass unused `profileUpdateSchema` bounds. |
| CMS `/studio` | Editorial titles, text/rich text, slugs, dates, chapter/publish flags, images/captions, video URLs, CTA/registration/donation links; all schemas under `src/sanity/schema` | Sanity is a separate authenticated input boundary. Shared URL helpers restrict schemes; some destinations also have host allowlists. Verify dataset write permissions and editor chapter boundaries in Sanity. |
| URLs and headers | News slug, intake UUID, Host, `__tenant`, forwarded IP/protocol, cookies | Parameterized news query, chapter-scoped applicant queries, tenant allowlist and proxy overwrites chapter headers. Preview tenant override is intentional. Production proxy behavior still needs testing. |
| Square webhook | Raw JSON body, signature header, incoming origin | HMAC verified before parsing; timing-safe comparison. Retry/error handling issue F9. |
| Cron `/api/cron/meeting-reminders` | Authorization bearer header | Rejects absent or wrong configured secret. Deployment scheduler/secret configuration not verified. |
| Cookie banner | Accept/close, localStorage value | Presentation state only; analytics renders unconditionally. See additional observations. |
| Static/contact/navigation | Links, tabs, menu controls, anchors | `/contact` links to email; no contact submission endpoint. Health, sitemap and robots expose no business-data mutation form. |

## Prioritized findings

### F1 — High: raw initiative submissions are publicly readable

Evidence: [initiative policy](../supabase/migrations/20260901000000_initiative_tracker.sql#L26); `src/lib/initiatives/tracker.ts` abbreviates names only when formatting rankings.

The SELECT policy allows every nondeleted row without an authentication or chapter condition. With API SELECT grants, callers can request full first/last names, per-person spending/activity, dates, business names, evidence paths and cleanup-token hashes across chapters. Showing only an initial on the website does not protect the underlying records. A private bucket still protects file bytes; the hash is not equivalent to the plaintext token.

Fix: revoke public base-table reads. Expose only deliberately selected aggregate/ranking data through a constrained server endpoint or carefully permissioned database interface. Test anonymous reads and cross-chapter reads directly against the API.

### F2 — High: a Secretary can assign themselves the legacy Admin role

Evidence: `supabase/migrations/00000000000004_chapter_members.sql:32` and `:37` (insert/update policies); `src/lib/auth/rbac.ts:25` (legacy role consumed by actions).

The chapter_members policies permit Admin and Secretary writes without restricting which columns/roles they may set. An approved Secretary can directly update their own chapter_members role to Admin. This expands legacy officer permissions, including financial operations. It does not by itself grant the separate profile-backed super_admin role.

Fix: restrict role assignment in a database trigger or tightly scoped RPC, enforce allowed transitions, and deny officer self-promotion. Cover direct API calls, not only member-management actions.

### F3 — High: direct database/storage operations bypass application MFA

Evidence: `src/lib/auth/authorization.ts:104`, `src/lib/auth/rbac.ts:51`; `supabase/migrations/20260817000000_member_admin_foundation.sql:133` and `:224`; legacy table/storage policies.

Website actions check AAL2, but the policy helpers check approved status and role without checking JWT assurance. A privileged account authenticated at AAL1 can use the direct API for permitted writes, including profile approval/role changes and legacy officer operations. Hiding pages behind MFA does not close that path.

Fix: enforce MFA for sensitive writes in RLS and privileged RPCs, with carefully defined service-role behavior. Supabase documents database-side MFA enforcement in its [MFA guide](https://supabase.com/docs/guides/auth/auth-mfa).

### F4 — High: any valid session can invoke an administrative password change

Evidence: `src/app/(public)/accept-invite/set-password-action.ts:6–17`.

The action checks password length and `getUser()`, then calls `admin.auth.admin.updateUserById`. It does not require a recovery/invitation flow, recent reauthentication, or MFA. A stolen valid session can therefore change the victim's password through this endpoint without proving current password/email possession. This is not an unauthenticated arbitrary-user reset: the target ID correctly comes from the verified session.

Fix: use the user-scoped password update flow with reauthentication and appropriate MFA/recovery checks. Runtime-validate the argument's type and maximum length, and rate-limit changes.

### F5 — Medium: direct API writes bypass document and intake-note constraints

Evidence: `supabase/migrations/00000000000008_documents.sql:40–51`; `supabase/migrations/00000000000012_prospective_member_notes.sql:26`; compare `src/app/(portal)/vault/upload/actions.ts` and `src/app/(portal)/intake/actions.ts`.

Document policies allow all three officer roles to insert/update metadata without enforcing the category/role matrix, bucket/path relationship, visibility list or uploader identity. For example, a Treasurer can change readable minutes metadata even though the action forbids minutes changes. Caller-chosen visibility rows referencing a known same-chapter path can also affect storage read authorization.

The note insert policy checks only the submitted chapter_id. An authorized intake officer can provide another chapter's applicant UUID and an arbitrary author_id, bypassing the ownership check in addNote. This permits false associations/attribution, not automatic access to the other chapter's applicant data.

Fix: enforce these relationships in the database, including parent/child chapter consistency and actor-derived authorship. Restrict direct writes or expose narrow RPCs.

### F6 — High: public upload throttling is absent or trivial to bypass

Evidence: `src/app/(public)/initiatives/actions.ts:19–21`; `src/app/(public)/community-events/scholarship/actions.ts:10–28`.

Initiatives are limited by caller-supplied first name; changing names gives fresh counters, and `failOpen: true` disables enforcement during Redis failures. Scholarship has no rate limiter and relies on a bypassable honeypot and seasonal gate. During the open season, repeated valid small submissions can consume storage, database capacity and notification quotas. The scholarship seasonal gate currently blocks this path in September, but does not protect the October–February window.

Initiative entries are automatically counted, with unverified names/evidence, so the same weakness also permits impersonation and inflated public totals.

Fix: use trusted IP plus additional account/session/recipient and global quotas, fail closed for anonymous writes, and apply a bot challenge when appropriate. Separate submitted metrics from verified reporting if accuracy matters.

### F7 — Medium: uploads trust file labels and can leave orphaned objects

Evidence: scholarship action `:24–30`; initiative action `:25–30`; `src/app/(portal)/vault/upload/upload-form.tsx:74`; storage bucket migrations.

Scholarship checks file presence/size but not allowed type or actual content. Its browser `accept` attribute is bypassable. Initiative checks the caller-provided MIME label, not the bytes. Vault has no application size/type validation, and migrations do not set per-bucket MIME/size limits. Global provider limits may still apply.

Scholarship uploads each file before validating the next; a missing later file or failed database insert leaves earlier uploads behind. Vault can also upload successfully and then fail metadata validation. Untrusted files present malware risk if downloaded/opened; this review did not establish a same-origin script execution path.

Fix: validate the entire request before writing, enforce bucket limits, verify signatures/parse expected formats, quarantine or scan uploads, and roll back partial uploads. Add an expiry cleanup process.

### F8 — High: audit RPC accepts forged identities; authorization updates are not audited

Evidence: `supabase/migrations/00000000000010_audit_logs.sql:28–44` and end-of-file profile exclusion; `src/app/(portal)/admin/members/actions.ts`.

`log_audit_event` is SECURITY DEFINER and inserts caller-supplied chapter, actor, action, target, IP and metadata without authorization or input bounds. No migration revokes its execution. Under default function privileges, even an anonymous caller can fabricate audit rows and consume database space. Verify effective grants: database functions are executable by all roles by default, as documented in [Supabase's function guide](https://supabase.com/docs/guides/database/functions).

The audit read policy also allows any row whose chapter_id is null. Separately, profiles have no audit trigger, and member approval/role actions do not log their changes, leaving the newest authorization system without an audit trail.

Fix: restrict RPC execution and derive identity/chapter server-side; remove public access to global audit rows; audit profile authorization changes with immutable old/new values and trusted actor attribution.

### F9 — Medium: payments need retry safety, throttling and reliable webhook processing

Evidence: `src/app/(portal)/pay/actions.ts:31`; `src/lib/square/handle-webhook.ts:30–47`; webhook route returns success after calling that helper.

A fresh Square idempotency key is created for each action invocation. A retry after an uncertain network outcome is not linked to the original purchase; duplicate-charge risk depends on token/payment-method behavior. The action has no application payment-attempt rate limit. Amount/type are chosen by the user, so this cannot enforce a fixed dues/event price; no automatic paid-in-full bypass was found.

Webhook database errors and unmatched transactions are logged but acknowledged with HTTP success. A delivery that races the transaction insert or hits a database outage can therefore be lost without a durable retry.

Fix: create a persisted payment intent with a stable retry key, apply member/IP quotas, use server-owned prices for fixed obligations, and durably queue/retry webhook updates. Preserve existing signature verification and unique Square payment IDs.

### F10 — Medium: attendance accepts fabricated locations and any event time

Evidence: `src/app/(portal)/events/actions.ts:84–121`.

Latitude/longitude come from the caller and can be replaced with the event coordinates. No start/end/time-window check occurs. A member can claim presence for a past or future event if they know its coordinates. This is attendance integrity, not cross-chapter access; the chapter filter is present.

Fix: enforce a check-in time window and use a rotating event code or officer confirmation when physical presence must be trusted. Browser GPS alone is not proof of attendance.

### F11 — Low: event datetime can pass validation and then throw

Evidence: `src/lib/validation/schemas.ts:113`; `src/app/(portal)/events/actions.ts:33`.

Any nonempty startsAt passes validation, but an invalid date causes `toISOString()` to throw. This is a bounded officer-triggered input-handling defect rather than a demonstrated system-wide denial of service.

Fix: validate a real supported datetime and timezone before conversion; return a normal field error.

### F12 — Medium: roster claiming proves knowledge, not the member's identity

Evidence: `src/lib/members/request-access.ts:64–102`; `src/lib/roster/verify-root-member.ts`; `supabase/migrations/20260818000001_claim_root_member_access_request.sql`.

Anyone knowing an unclaimed active membership number and surname can request an invitation to an arbitrary email. A successful claim reserves the roster entry before the invite is accepted. The profile remains pending, so this is not immediate approved access, but it permits roster squatting and plausible impersonation in the approval queue.

Fix: deliver verification to an existing trusted roster contact, or require an officer to independently verify ownership before claiming. Expire unaccepted claims. Retain neutral responses and atomic duplicate protection.

## Additional observations and verification limits

- **Request-size mismatch:** public forms advertise 8 MB or seven 10 MB uploads, but next.config.ts has no Server Action body-size override. Next.js documents a default 1 MB aggregate limit in its [Server Actions configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions). Verify the exact installed version/hosting limits before changing upload transport. Small repeated uploads still make F6 relevant.
- **Forwarded IP trust:** public forms read x-forwarded-for, and join uses the entire header rather than one normalized address. Confirm the production edge overwrites untrusted client values; otherwise callers may rotate rate-limit keys. This is deployment-dependent, not a proven Vercel bypass.
- **Headers:** HSTS, nosniff and referrer policy are configured. No CSP/frame-ancestors or X-Frame-Options is configured here. Add framing protection and a tested CSP as defense in depth. `geolocation=()` currently prevents the legitimate GPS check-in UI from acquiring location; resolve that functionality conflict along with F10.
- **Consent:** `src/components/cookie-consent.tsx` only stores/hides presentation state; `src/app/layout.tsx:46` always renders Analytics. Do not interpret acceptance as an enforced analytics gate. No legal compliance conclusion is made.
- **CMS:** normal React text rendering and shared URL checks are useful protections; no application `dangerouslySetInnerHTML` sink was found. Sanity rich-text link behavior, hosted write permissions, asset handling and editor role boundaries require runtime/provider verification. HTTPS alone does not establish that a donation destination is trustworthy.
- **Direct profile updates:** safe profile fields have no database length constraints corresponding to the unused profileUpdateSchema. Enforce bounds at the API/database boundary, especially for signup metadata feeding full_name.
- **Local Auth configuration:** config.toml enables signup, disables email confirmation and TOTP, and enables secure password change. These are local configuration values, not evidence of hosted settings. Confirm production configuration explicitly.
- **Validation positives:** most server actions reparse data, parameterized queries are widely used, sensitive lookups generally scope chapter IDs, private storage is used, and Supabase getUser verifies server sessions. There is no demonstrated SQL injection or unauthenticated cross-user password reset in this review. The raw `.or()` filter in initiative snapshots currently receives a server-generated month, not public input.
- **Testing:** existing tests include schema fuzzing, redirects, tenant isolation and member management. Many fuzz assertions establish that parsing does not throw; they do not prove authorization boundaries. The attempted redirect test could not start because `tsx` is absent after the sandbox startup issue was cleared. Local Next.js guides under node_modules/next/dist/docs were also absent. No runtime tests are reported as passing.

## Recommended order of work

1. Restrict raw initiative reads and audit RPC execution; fix officer self-promotion and database MFA enforcement.
2. Replace privileged password changing with a properly authorized user flow.
3. Enforce document/note rules in the database and test direct API access with anonymous, member, officer, admin, AAL1 and AAL2 sessions from two chapters.
4. Harden public upload quotas, validation, cleanup and reporting verification before scholarship applications open.
5. Add stable payment retries, durable webhook processing, attendance time controls and the smaller validation/header fixes.

Verification should use an isolated database with the full migration sequence and explicit effective-grant checks. The highest-value tests send requests directly to Supabase so they cannot accidentally rely on protections provided only by the website.
