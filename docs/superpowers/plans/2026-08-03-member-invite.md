# Member Invite & Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an Admin, Secretary, or Intake Director invite a person to the portal — standalone or from an approved intake application — through to that person setting a password and landing in the portal as a `Member`.

**Architecture:** A shared Server Action (`inviteMember`) backed by a service-role wrapper (`provisionMemberInvite`) that calls `admin.auth.admin.inviteUserByEmail()` then inserts a `chapter_members` row, with rollback (delete the auth user) if the second step fails. Two entry points call this action: a standalone invite page, and an "Invite to Portal" button on an approved intake application. A new PKCE code-exchange route (`/auth/confirm`) and a "set your password" page (`/accept-invite`) complete the loop.

**Tech Stack:** Next.js 16 App Router (Server Components + Server Actions), `@supabase/ssr` + `@supabase/supabase-js` (service-role client), `zod`, `react-hook-form` + `@hookform/resolvers/zod`.

## Global Constraints

- No automated test suite exists in this repo. Every task's "test" step is: `npx tsc --noEmit -p tsconfig.json`, `rm -rf .next && npm run build`, `npm run lint` — all three must exit clean. Live smoke tests (a real invite email arriving and the accept flow completing) are deferred until Supabase Auth SMTP is configured (a new external dependency — Supabase's built-in email sender is rate-limited and not for production use; it can reuse the Resend account/domain from Phase D via Resend's separate SMTP credentials).
- The service-role Supabase client (`src/lib/supabase/admin.ts`, `createAdminClient()`) must never be imported under `src/app/**` — ESLint's `no-restricted-imports` rule enforces this. Route any service-role DB/auth-admin call through a wrapper in `src/lib/**`.
- Every Server Action calls `requireRole(...)` (from `src/lib/auth/rbac.ts`, returns `{ user, role, chapterId, supabase }`) as its first line and re-validates its input against a `zod` schema from `src/lib/validation/schemas.ts` — never trust a client-supplied `chapterId`.
- New UI matches the established brand: `bg-navy`/`bg-navy-dark`/`text-navy` Tailwind utilities, `font-serif` for headings (where headings exist — this feature's forms are plain, matching the vault/pay forms' style, not `font-serif`), the existing form-field styling (`w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900`).
- Every role-gated page/layout that calls `requireRole` must catch `MfaRequiredError` before `PermissionError` and redirect to `/security/mfa` first (established pattern; `Intake Director` and `Admin` both require MFA per `MFA_REQUIRED_ROLES` in `src/types/domain.ts` — `Secretary` does not).
- Never commit real API keys, tokens, or secrets. `.env.local` stays gitignored; no new env vars are needed by this feature (Supabase Auth SMTP is configured entirely in the Supabase dashboard, not via this repo's env vars).

---

## Task 1: Invite schema + service-role provisioning wrapper

**Files:**
- Modify: `src/lib/validation/schemas.ts` (add `inviteMemberSchema`)
- Create: `src/lib/members/invite-member.ts`

**Interfaces:**
- Consumes: `createAdminClient()` from `src/lib/supabase/admin.ts`.
- Produces: `inviteMemberSchema` (zod schema + `InviteMemberInput` type) in `src/lib/validation/schemas.ts`, and `provisionMemberInvite(params): Promise<{ error: string | null }>` in `src/lib/members/invite-member.ts` — both consumed only by Task 2's Server Action.

- [ ] **Step 1: Add the invite zod schema**

Append to `src/lib/validation/schemas.ts`:

```ts
export const inviteMemberSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
```

- [ ] **Step 2: Write the service-role provisioning wrapper**

```ts
// src/lib/members/invite-member.ts
import { createAdminClient } from "@/lib/supabase/admin";

export async function provisionMemberInvite(params: {
  chapterId: string;
  fullName: string;
  email: string;
  redirectTo: string;
}): Promise<{ error: string | null }> {
  const admin = createAdminClient();

  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(params.email, {
      data: { full_name: params.fullName },
      redirectTo: params.redirectTo,
    });

  if (inviteError || !inviteData?.user) {
    // Supabase returns a distinct error when the email already belongs to
    // an existing user — this IS the duplicate-invite check; no separate
    // tracking column is needed.
    if (inviteError?.message?.toLowerCase().includes("already been registered")) {
      return { error: "This person already has an account." };
    }
    return { error: "Could not send invite. Please try again." };
  }

  const userId = inviteData.user.id;

  // handle_new_user (00000000000003_profiles.sql) already auto-created the
  // profiles row from raw_user_meta_data.full_name — only chapter_members
  // needs inserting here.
  const { error: memberError } = await admin.from("chapter_members").insert({
    chapter_id: params.chapterId,
    profile_id: userId,
    role: "Member",
  });

  if (memberError) {
    // Roll back the orphaned auth user rather than leaving an account with
    // no chapter membership — same "clean up on partial failure" pattern
    // as the vault upload's orphaned-Storage-object cleanup.
    await admin.auth.admin.deleteUser(userId);
    return { error: "Could not complete invite. Please try again." };
  }

  return { error: null };
}
```

- [ ] **Step 3: Verify**

Run `npx tsc --noEmit -p tsconfig.json` — must exit clean (no build/lint yet, nothing calls this code path so it's dead code until Task 2, but typecheck catches signature mistakes now).

- [ ] **Step 4: Commit**

```bash
git add src/lib/validation/schemas.ts src/lib/members/invite-member.ts
git commit -m "Add invite schema and service-role member-provisioning wrapper"
```

---

## Task 2: Shared `inviteMember` Server Action

**Files:**
- Create: `src/app/(portal)/members/invite/actions.ts`

**Interfaces:**
- Consumes: `requireRole` from `src/lib/auth/rbac.ts`, `inviteMemberSchema` and `provisionMemberInvite` from Task 1.
- Produces: `inviteMember(input: Record<string, unknown>): Promise<{ error: string | null }>`, consumed by Task 3's standalone form and Task 4's intake-triggered button.

- [ ] **Step 1: Write the Server Action**

```ts
// src/app/(portal)/members/invite/actions.ts
"use server";

import { requireRole } from "@/lib/auth/rbac";
import { provisionMemberInvite } from "@/lib/members/invite-member";
import { inviteMemberSchema } from "@/lib/validation/schemas";

const INVITE_ROLES = ["Admin", "Secretary", "Intake Director"] as const;

export async function inviteMember(
  input: Record<string, unknown>
): Promise<{ error: string | null }> {
  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }

  const { chapterId } = await requireRole(INVITE_ROLES);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const redirectTo = `${siteUrl}/auth/confirm?next=${encodeURIComponent("/accept-invite")}`;

  return provisionMemberInvite({
    chapterId,
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    redirectTo,
  });
}
```

- [ ] **Step 2: Verify**

Run `npx tsc --noEmit -p tsconfig.json` — must exit clean.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(portal)/members/invite/actions.ts"
git commit -m "Add inviteMember Server Action"
```

---

## Task 3: Standalone invite page + nav link

**Files:**
- Create: `src/app/(portal)/members/invite/page.tsx`
- Create: `src/app/(portal)/members/invite/invite-form.tsx`
- Modify: `src/app/(portal)/layout.tsx` (add role-gated "Invite" nav link)

**Interfaces:**
- Consumes: `requireRole`, `PermissionError`, `MfaRequiredError` from `src/lib/auth/rbac.ts`; `inviteMember` from Task 2.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Build the page (role-gated, same redirect pattern as the vault upload page)**

```tsx
// src/app/(portal)/members/invite/page.tsx
import { redirect } from "next/navigation";
import { requireRole, PermissionError, MfaRequiredError } from "@/lib/auth/rbac";
import { InviteForm } from "./invite-form";

const INVITE_ROLES = ["Admin", "Secretary", "Intake Director"] as const;

export default async function InviteMemberPage() {
  try {
    await requireRole(INVITE_ROLES);
  } catch (err) {
    if (err instanceof MfaRequiredError) redirect("/security/mfa");
    if (err instanceof PermissionError) redirect("/dashboard");
    throw err;
  }

  return (
    <div className="max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold">Invite a Member</h1>
      <InviteForm />
    </div>
  );
}
```

- [ ] **Step 2: Build the client form**

```tsx
// src/app/(portal)/members/invite/invite-form.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteMemberSchema, type InviteMemberInput } from "@/lib/validation/schemas";
import { inviteMember } from "./actions";

export function InviteForm() {
  const [result, setResult] = useState<{ error: string | null; sent: boolean }>({
    error: null,
    sent: false,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteMemberInput>({ resolver: zodResolver(inviteMemberSchema) });

  async function onSubmit(values: InviteMemberInput) {
    setResult({ error: null, sent: false });
    const outcome = await inviteMember(values);
    if (outcome.error) {
      setResult({ error: outcome.error, sent: false });
      return;
    }
    setResult({ error: null, sent: true });
    reset();
  }

  if (result.sent) {
    return (
      <p className="rounded-md border border-zinc-200 p-4 text-sm dark:border-zinc-800">
        Invite sent. They&apos;ll receive an email with a link to set their password.
      </p>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="fullName" className="text-sm font-medium">
          Full Name
        </label>
        <input
          id="fullName"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          {...register("fullName")}
        />
        {errors.fullName && (
          <p className="text-sm text-red-600">{errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {result.error && <p className="text-sm text-red-600">{result.error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-navy px-4 py-2 font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
      >
        {isSubmitting ? "Sending…" : "Send Invite"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Add the role-gated "Invite" nav link**

In `src/app/(portal)/layout.tsx`, add alongside the existing `Intake`/`Admin` conditional links (after the `Intake` link, before the `Admin` link):

```tsx
        {(role === "Admin" || role === "Secretary" || role === "Intake Director") && (
          <Link href="/members/invite" className="text-sm text-zinc-600 dark:text-zinc-400">
            Invite
          </Link>
        )}
```

- [ ] **Step 4: Verify**

Run `npx tsc --noEmit -p tsconfig.json`, `rm -rf .next && npm run build`, `npm run lint` — all clean. No live smoke test yet (Task 5 completes the loop; do the end-to-end live test after Task 5, once Supabase Auth SMTP is available).

- [ ] **Step 5: Commit**

```bash
git add "src/app/(portal)/members/invite/page.tsx" "src/app/(portal)/members/invite/invite-form.tsx" "src/app/(portal)/layout.tsx"
git commit -m "Add standalone member invite page and nav link"
```

---

## Task 4: Intake-triggered invite button

**Files:**
- Modify: `src/app/(portal)/intake/[id]/page.tsx:92-101` (add an "Invite to Portal" section when the applicant is approved)
- Create: `src/app/(portal)/intake/[id]/invite-button.tsx`

**Interfaces:**
- Consumes: `inviteMember` from Task 2.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Build the pre-filled invite button/form**

This is a small client component: a single button that, on click, calls `inviteMember` with the applicant's name/email already known (no form fields needed — the applicant's name and email are already fixed data from the intake application, not user input to edit here).

```tsx
// src/app/(portal)/intake/[id]/invite-button.tsx
"use client";

import { useState } from "react";
import { inviteMember } from "../../members/invite/actions";

export function InviteButton({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  const [state, setState] = useState<{ pending: boolean; error: string | null; sent: boolean }>({
    pending: false,
    error: null,
    sent: false,
  });

  async function handleInvite() {
    setState({ pending: true, error: null, sent: false });
    const result = await inviteMember({ fullName, email });
    if (result.error) {
      setState({ pending: false, error: result.error, sent: false });
      return;
    }
    setState({ pending: false, error: null, sent: true });
  }

  if (state.sent) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Invite sent to {email}.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => void handleInvite()}
        disabled={state.pending}
        className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
      >
        {state.pending ? "Sending…" : "Invite to Portal"}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Wire it into the intake detail page, shown only when approved**

In `src/app/(portal)/intake/[id]/page.tsx`, add the import at the top alongside the existing `StageForm`/`NoteForm` imports:

```tsx
import { InviteButton } from "./invite-button";
```

Then insert a new section between the existing "Pipeline Stage" block (ends at line 101) and the "Internal Notes" block (starts at line 103):

```tsx
      {applicant.pipeline_stage === "approved" && (
        <div>
          <h2 className="text-sm font-semibold uppercase text-zinc-500">
            Onboarding
          </h2>
          <div className="mt-3">
            <InviteButton fullName={applicant.full_name} email={applicant.email} />
          </div>
        </div>
      )}
```

- [ ] **Step 3: Verify**

Run `npx tsc --noEmit -p tsconfig.json`, `rm -rf .next && npm run build`, `npm run lint` — all clean.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(portal)/intake/[id]/page.tsx" "src/app/(portal)/intake/[id]/invite-button.tsx"
git commit -m "Add Invite to Portal button on approved intake applications"
```

---

## Task 5: Accept-invite flow (code exchange + set password)

**Files:**
- Create: `src/app/auth/confirm/route.ts`
- Create: `src/app/(public)/accept-invite/page.tsx`
- Create: `src/app/(public)/accept-invite/set-password-form.tsx`
- Modify: `src/app/(public)/login/page.tsx:10-34` (surface an `?error=invite-expired` message)

**Interfaces:**
- Consumes: `createClient()` from `src/lib/supabase/server.ts` (route handler), `createClient()` from `src/lib/supabase/client.ts` (browser, in the set-password form).
- Produces: nothing consumed by later tasks — this is the final leaf of the flow.

- [ ] **Step 1: Code-exchange route**

```ts
// src/app/auth/confirm/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") ?? "/accept-invite";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=invite-expired", request.url)
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=invite-expired", request.url)
    );
  }

  return NextResponse.redirect(new URL(next, request.url));
}
```

- [ ] **Step 2: Accept-invite page (confirms a session exists, renders the set-password form)**

```tsx
// src/app/(public)/accept-invite/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SetPasswordForm } from "./set-password-form";

export default async function AcceptInvitePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-navy">Set Your Password</h1>
        <SetPasswordForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Client set-password form**

```tsx
// src/app/(public)/accept-invite/set-password-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setPending(false);
    if (updateError) {
      setError("Could not set your password. Please try again.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          New Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-navy px-4 py-2 font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
      >
        {pending ? "Saving…" : "Set Password and Continue"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Surface the expired-invite error on the login page**

In `src/app/(public)/login/page.tsx`, the `LoginForm` component already reads `searchParams` (line 12) for the `redirect` param. Add a read of the `error` param and an inline message, rendered above the form's own submit-error paragraph. Replace the `LoginForm` function's opening lines (1-13 of the function body) so it now also derives an `inviteExpiredMessage`:

```tsx
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const inviteExpired = searchParams.get("error") === "invite-expired";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
```

Then, immediately inside the returned `<form>`, right after the `<h1>` heading (after line 41 in the current file), add:

```tsx
      {inviteExpired && (
        <p className="text-sm text-red-600">
          That invite link has expired. Ask an officer to resend your invite.
        </p>
      )}
```

- [ ] **Step 5: Verify (build/lint + live smoke test if SMTP is configured)**

`npx tsc --noEmit -p tsconfig.json`, `rm -rf .next && npm run build`, `npm run lint` — all clean. Live: if Supabase Auth SMTP has been configured by this point, send a real invite via `/members/invite`, confirm the email arrives, click through to `/auth/confirm`, confirm redirect to `/accept-invite`, set a password, confirm redirect to `/dashboard` and successful sign-in on a subsequent visit to `/login`. If SMTP is not yet configured, skip the live test — this is expected and should be tracked as a deferred verification item, same as Phases C/D/E's credential-gated live tests.

- [ ] **Step 6: Commit**

```bash
git add src/app/auth src/app/"(public)"/accept-invite src/app/"(public)"/login/page.tsx
git commit -m "Add accept-invite flow: code exchange, set-password page, expired-invite login message"
```

---

## Self-Review

**Spec coverage:** Standalone invite page (Task 3) ✓, intake-triggered invite (Task 4) ✓, shared Server Action + service-role wrapper with rollback-on-failure (Tasks 1-2) ✓, PKCE accept-invite flow (Task 5) ✓, role gating (Admin/Secretary/Intake Director) on both entry points and the nav link ✓, duplicate-invite detection via Supabase's existing-user error (Task 1) ✓, expired-invite messaging on login (Task 5) ✓. The design's "no new migration" and "no Resend/API changes" non-goals are respected — no task touches `supabase/migrations/` or the `resend` package.

**Placeholder scan:** no "TBD"/"TODO" in any step; every code block is complete and ready to paste.

**Type consistency:** `inviteMember(input: Record<string, unknown>): Promise<{ error: string | null }>` (Task 2) matches its two callers exactly — Task 3's `InviteForm` passes `values: InviteMemberInput` (a superset-compatible shape) and Task 4's `InviteButton` passes `{ fullName, email }` directly. `provisionMemberInvite`'s params (Task 1) match every field the Server Action passes in Task 2. `requireRole`'s return shape (`{ user, role, chapterId, supabase }`) is used consistently with every other Server Action in this codebase.
