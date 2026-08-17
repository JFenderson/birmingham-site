# Deferred Follow-Ups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close out the known, documented gaps left behind across Phases C, D, and F, and the member-invite feature — each was explicitly parked during a final whole-branch review as "real but not blocking," not forgotten.

**Architecture:** No new subsystems — every task here modifies existing files in an already-shipped feature to close a specific gap its own review documented. Tasks are independent of each other (different subsystems: Square/webhook, cron/email, Sanity CMS, audit logging) and can be done in any order or split across separate branches.

**Tech Stack:** Same as the rest of this repo — Next.js 16 App Router, Supabase (Postgres RLS + service-role client), `zod`, existing Square/Resend/Sanity SDKs already installed.

## Global Constraints

- No automated test suite exists in this repo. Every task's "test" steps are: `npx tsc --noEmit -p tsconfig.json`, `rm -rf .next && npm run build`, `npm run lint` — all three must exit clean.
- The service-role Supabase client (`src/lib/supabase/admin.ts`) must never be imported under `src/app/**` — ESLint enforces this.
- Every Server Action calls `requireRole(...)` as its first line (or immediately after zod validation, per this codebase's established precedent) and re-validates input via `zod`.
- Never commit real API keys, tokens, or secrets.

---

## Task 1: Webhook-settled payments never trigger a confirmation email

**Background:** `src/lib/square/record-payment.ts`'s `recordTransaction()` only sends the payment-confirmation email on the synchronous path (`params.status === "completed"` at insert time). A payment that returns `APPROVED`/pending from `payments.create()` and settles later via the Square webhook (`src/lib/square/handle-webhook.ts`) never gets a confirmation email, because the webhook only runs a bare `UPDATE ... set status`, not `recordTransaction()`.

**Files:**
- Modify: `src/lib/square/handle-webhook.ts`

**Interfaces:**
- Consumes: `sendPaymentConfirmationEmail` from `src/lib/email/send-payment-confirmation.ts`, `resolveRecipient` from `src/lib/email/resolve-recipient.ts` (both already exist).

- [ ] **Step 1: Read the current webhook handler in full**

Read `src/lib/square/handle-webhook.ts` end to end before editing — confirm the exact shape of the `.update(...)` call and what columns are already selected/returned, so the fix below fits without duplicating a query.

- [ ] **Step 2: Fetch the row's previous status, fire the email only on a real completion transition**

Change the `.update(...)` call to `.select("id, profile_id, type, amount_cents, status")` on both the pre-update read and the post-update result (or restructure into a read-then-update if that's cleaner given the current code shape), so the handler can compare "was it already completed before this webhook fired" against "is it completed now." Only send the confirmation email when the transition is genuinely `not-completed -> completed` (never on `completed -> completed`, which would double-send if Square ever redelivers the same webhook event):

```ts
// Illustrative shape — adapt to the file's actual existing structure,
// variable names, and error-handling conventions:
const { data: existing } = await admin
  .from("transactions")
  .select("status, profile_id, type, amount_cents")
  .eq("square_payment_id", payment.id)
  .maybeSingle();

if (!existing) return; // unchanged — no matching row, nothing to update

const wasAlreadyCompleted = existing.status === "completed";

const { data, error } = await admin
  .from("transactions")
  .update({ status })
  .eq("square_payment_id", payment.id)
  .select("id");

// ...existing error/zero-row logging stays as-is...

if (status === "completed" && !wasAlreadyCompleted) {
  try {
    const recipient = await resolveRecipient(admin, existing.profile_id);
    if (recipient) {
      await sendPaymentConfirmationEmail({
        to: recipient.email,
        recipientName: recipient.name,
        amountCents: existing.amount_cents,
        type: existing.type,
      });
    }
  } catch (err) {
    console.error("[webhook] payment confirmation email failed", {
      paymentId: payment.id,
      error: err,
    });
  }
}
```

- [ ] **Step 3: Verify**

`npx tsc --noEmit -p tsconfig.json`, `rm -rf .next && npm run build`, `npm run lint` — all clean. Live test (a sandbox payment that returns non-COMPLETED synchronously, then completes via a real webhook event, confirming exactly one email arrives) requires real Square sandbox credentials and a reachable webhook URL — per this repo's earlier phases, this is a deferred live-test item, not a blocker for merging the code fix.

- [ ] **Step 4: Commit**

```bash
git add src/lib/square/handle-webhook.ts
git commit -m "Send payment confirmation email when a payment settles via webhook, not just synchronously"
```

---

## Task 2: Meeting-reminder cron has no execution-time guard and no batching

**Background:** `src/lib/events/send-meeting-reminders.ts` awaits each member's lookup+send serially inside a loop, with no `maxDuration` set on the route. At scale this risks a Vercel function timeout truncating the run mid-loop; since there's no persisted dedupe state (an accepted design tradeoff from Task D2), a truncated run means the remaining members never get that day's reminder and there's no automatic retry.

**Files:**
- Modify: `src/app/api/cron/meeting-reminders/route.ts`
- Modify: `src/lib/events/send-meeting-reminders.ts`

**Interfaces:**
- No signature changes — `sendMeetingReminders()`'s return shape (`{ sent, errors, skipped }`) stays the same.

- [ ] **Step 1: Set a longer execution budget on the route**

In `src/app/api/cron/meeting-reminders/route.ts`, add (near the top of the file, alongside any other route segment config):

```ts
export const maxDuration = 60; // seconds — Vercel Pro allows up to 300s if this isn't enough
```

- [ ] **Step 2: Batch per-member sends instead of one at a time**

In `src/lib/events/send-meeting-reminders.ts`, read the current member-processing loop in full first. Replace the fully-serial `for...of` loop over members with chunked concurrency — e.g. process members in batches of 10 using `Promise.allSettled`, tallying `sent`/`errors`/`skipped` from each batch's settled results before moving to the next batch (don't fire all members at once with unbounded `Promise.all` — that risks tripping Resend's own rate limit, already documented as a known-brittle path in this same file's error handling).

```ts
// Illustrative shape — adapt variable names to the file's existing code:
const BATCH_SIZE = 10;
for (let i = 0; i < members.length; i += BATCH_SIZE) {
  const batch = members.slice(i, i + BATCH_SIZE);
  const results = await Promise.allSettled(batch.map((member) => processMember(member, event)));
  for (const result of results) {
    if (result.status === "rejected") {
      errors++;
      console.error("[meeting-reminders] batch item failed", result.reason);
    }
    // ...existing sent/skipped tallying, refactored into whatever
    // processMember returns for a fulfilled result...
  }
}
```

(`processMember` here is a placeholder name for whatever the existing per-member logic gets extracted into — extract the current loop body into a small local function so both the old call site's logic and the new batching wrapper stay readable, rather than inlining a nested try/catch inside the batch-processing loop.)

- [ ] **Step 3: Verify**

`npx tsc --noEmit -p tsconfig.json`, `rm -rf 	next && npm run build`, `npm run lint` — all clean. No automated test suite exists; the actual timeout/batching behavior can only be observed live against a real roster size, which requires Resend + Supabase credentials already configured from prior phases — do a live test if you have a chapter with enough members to make batching observable, otherwise this is safe to ship based on code review alone (the batching change can't make correctness worse than serial processing, only faster/safer under load).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/cron/meeting-reminders/route.ts src/lib/events/send-meeting-reminders.ts
git commit -m "Add execution-time budget and batched sends to the meeting-reminder cron"
```

---

## Task 3: Member-invite account creation has no audit trail

**Background:** `provisionMemberInvite()` (`src/lib/members/invite-member.ts`) inserts the `chapter_members` row via the service-role client, so the `audit_chapter_members` trigger (`00000000000010_audit_logs.sql`) records `(select auth.uid())` as the actor — which is NULL under the service-role client. Creating a new login account is exactly the kind of security-relevant action this repo's own audit-log migration comment says should be logged with the real actor, not left null.

**Files:**
- Modify: `src/lib/members/invite-member.ts`

**Interfaces:**
- Consumes: whatever `log_audit_event()` signature the migration defines — read `supabase/migrations/00000000000010_audit_logs.sql` first to get the exact function signature before writing this task's code (this brief intentionally does not restate it, to avoid drifting from the real signature).
- `provisionMemberInvite`'s own signature must gain one new required parameter: the inviting officer's `user.id` (and, if the migration's `log_audit_event` requires an IP, that too — check the signature first).

- [ ] **Step 1: Read the audit-log migration and one existing caller of `log_audit_event`**

Read `supabase/migrations/00000000000010_audit_logs.sql` in full, then grep the codebase for any existing direct call to `log_audit_event` from application code (if none exists yet, this is the first — check how `record-payment.ts` or `handle-webhook.ts` structure their own logging calls for a stylistic reference instead) to confirm the exact parameter names/order expected.

- [ ] **Step 2: Thread the officer's `user.id` through to `provisionMemberInvite`**

In `src/app/(portal)/members/invite/actions.ts`, `requireRole(...)` already returns `user` — pass `user.id` as a new field in the object already being passed to `provisionMemberInvite`.

In `src/lib/members/invite-member.ts`, add `invitedBy: string` to `provisionMemberInvite`'s params type, and after a successful `chapter_members` insert, call `log_audit_event` (via whatever the real signature from Step 1 requires) recording the officer as the actor and the new member's `chapter_members` row as the affected record. Wrap this in try/catch — a failed audit-log call must not fail the invite itself (same best-effort principle already used for every email send in this codebase); log any failure with `console.error`.

- [ ] **Step 3: Verify**

`npx tsc --noEmit -p tsconfig.json`, `rm -rf .next && npm run build`, `npm run lint` — all clean. Live test: invite a test member, confirm the resulting `audit_logs` row has the inviting officer's `profile_id` as the actor rather than null, then clean up the test account and audit row.

- [ ] **Step 4: Commit**

```bash
git add src/app/"(portal)"/members/invite/actions.ts src/lib/members/invite-member.ts
git commit -m "Record the inviting officer as the actor in audit_logs for member invites"
```

---

## Task 4: Pending (never-accepted) invitees receive meeting reminders immediately

**Background:** `chapter_members.status` defaults to `'active'` on insert, so a person who was invited but has not yet accepted (set a password) starts receiving meeting-reminder emails (Phase D) right away — `send-meeting-reminders.ts` filters only on `status = 'active'`, with no way to distinguish "really active" from "invited, still pending." The member-invite design's explicit non-goal ruled out a schema migration for this; this task revisits that now that it's a known, live nuisance rather than a hypothetical.

**Files:**
- Create: `supabase/migrations/00000000000013_chapter_members_pending_status.sql`
- Modify: `src/lib/members/invite-member.ts`
- Modify: `src/lib/events/send-meeting-reminders.ts`

**Interfaces:**
- No change to `chapter_members`'s existing `status` check constraint values (`'active','inactive','alumni','suspended'`) for any EXISTING row — this task only changes what a fresh invite writes at creation time, and adds one new valid status.

- [ ] **Step 1: Add a `'pending'` status value**

```sql
-- supabase/migrations/00000000000013_chapter_members_pending_status.sql
alter table public.chapter_members
  drop constraint chapter_members_status_check;

alter table public.chapter_members
  add constraint chapter_members_status_check
  check (status in ('active','inactive','alumni','suspended','pending'));
```

(Confirm the actual constraint name via `\d chapter_members` or by reading `00000000000004_chapter_members.sql` again — Postgres auto-names inline `check` constraints, so the literal name above may need adjusting to match what actually exists; do not guess blindly, verify against the real schema first.)

- [ ] **Step 2: Insert new invites as `'pending'`, not the default `'active'`**

In `src/lib/members/invite-member.ts`, add `status: "pending"` explicitly to the `chapter_members` insert object.

- [ ] **Step 3: Flip status to `'active'` when the invite is accepted**

The accept-invite flow (`src/app/(public)/accept-invite/page.tsx` / `set-password-form.tsx`) currently only calls `supabase.auth.updateUser({ password })`. After that succeeds, also update this user's `chapter_members` row from `'pending'` to `'active'`. Since this runs under the invited user's own (now-authenticated) session, not the service-role client, check whether the existing `chapter_members_officer_update` RLS policy would block a member updating their own row's status — if so, this update needs to go through a small `src/lib/**` service-role wrapper (a new one-off function, following this codebase's established boundary pattern) rather than the client-side Supabase call, since a self-service status flip isn't something the existing officer-only update policy is meant to allow.

- [ ] **Step 4: Exclude `'pending'` from meeting reminders**

`src/lib/events/send-meeting-reminders.ts`'s member query already filters `.eq("status", "active")` — this already correctly excludes `'pending'` once Step 2 ships, since `'pending'` is a distinct value from `'active'`. No change needed here beyond confirming this via a quick read of the file — do not add a redundant explicit exclusion.

- [ ] **Step 5: Verify**

`npx tsc --noEmit -p tsconfig.json`, `rm -rf .next && npm run build`, `npm run lint` — all clean. Live test: invite a test member, confirm their `chapter_members.status` is `'pending'` immediately after invite and `'active'` only after they complete the accept-invite flow; confirm a `'pending'` member does not appear in a meeting-reminder cron dry run.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/00000000000013_chapter_members_pending_status.sql src/lib/members/invite-member.ts src/app/"(public)"/accept-invite src/lib/events/send-meeting-reminders.ts
git commit -m "Add pending chapter_members status so unaccepted invites don't receive meeting reminders"
```

---

## Task 5: Sanity CMS has no per-chapter write authorization

**Background:** `chapterSlug` on a Sanity `post` is now a required dropdown (fixed during Phase F's review), which prevents typos and silent content loss — but it does not prevent any Sanity Studio user from choosing a different chapter's slug and authoring content for a chapter they don't belong to. Real per-chapter write authorization requires Sanity-side role/dataset design, which is a decision this plan flags rather than makes unilaterally.

**This task is a decision point, not a ready-to-implement spec.** Do not start implementation from this text alone.

- [ ] **Step 1: Decide the authorization model with the human partner**

Sanity offers a few real options, each with different tradeoffs — this needs a conversation, not a default:
- **Custom roles** (Sanity's role-based access control, available on paid plans) restricting which users can edit which documents based on a field value — the most direct fit, but requires a paid Sanity plan tier and non-trivial role/permission configuration in Sanity's dashboard.
- **Separate datasets per chapter** — stronger isolation, but a bigger structural change (the app's GROQ queries, the Studio config, and any cross-chapter reporting would all need to become dataset-aware).
- **Accept the current state** as a low-risk tradeoff for now, given the CMS's actual user base is a small, trusted group of officers — revisit only if that user base grows or an actual incident occurs.

- [ ] **Step 2: Once a direction is chosen, write a proper design spec and plan for it**

This is intentionally out of scope for this plan — follow this codebase's established `brainstorming` → `writing-plans` flow once a direction is picked, since it may involve schema/infrastructure decisions beyond a simple code fix.

---

## Self-Review

**Spec coverage:** Task 1 (webhook-completed payment email) ✓, Task 2 (cron execution safety) ✓, Task 3 (invite audit trail) ✓, Task 4 (pending-status data hygiene) ✓, Task 5 (Sanity write authorization) — explicitly scoped as a decision point, not an implementation task, since making that call unilaterally would be a bigger unilateral architecture decision than this plan should make.

**Placeholder scan:** Tasks 1-4 have concrete, complete-enough-to-implement code; Task 5 is deliberately a decision gate, not a placeholder — its "steps" are conversation steps, not code steps, which is the correct shape for a genuinely open decision.

**Type consistency:** `provisionMemberInvite`'s params gain `invitedBy` (Task 3) and its insert gains an explicit `status` (Task 4) — both are additive changes to an existing, already-shipped function signature; no existing caller (`src/app/(portal)/members/invite/actions.ts`) needs anything beyond passing the one new field Task 3 requires.
