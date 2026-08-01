# Phase 2 UI/UX Execution Plan

Goal: translate the technical implementation plan into a concrete UI/UX roadmap that ships a consistent, secure, mobile-first experience across portal and public surfaces.

Source alignment: this plan is derived from [2026-07-31-phase2-remaining.md](docs/superpowers/plans/2026-07-31-phase2-remaining.md) and keeps the same feature order and role/security constraints.

## 1. UX Priorities and Rollout Order

1. MFA lockout fix experience (highest urgency)
2. Vault read/download/upload/delete experience
3. Payments checkout and confirmation experience
4. Transactional email content quality and trust signals
5. Rate-limit user feedback states
6. News/CMS authoring and public reading experience

Reason for this order: MFA currently blocks core officer access; Vault and Pay are member-facing value; CMS is additive and can ship after secure flows are stable.

## 2. Global Design Direction

- Brand colors: use existing `bg-navy`, `bg-navy-dark`, `text-navy` tokens from [src/app/globals.css](src/app/globals.css).
- Typography: headings in serif (`font-serif`), body in sans, preserve current contrast standards.
- Surfaces:
  - Primary cards: white or near-white backgrounds with subtle borders.
  - Secondary surfaces: soft muted backgrounds for grouping actions.
- Spacing rhythm: section-level `py-8` to `py-12`, card internals `p-4` to `p-6`.
- Form fields: reuse established field classes in the implementation plan.
- Interaction style:
  - Explicit success/error copy under controls.
  - Disable buttons while pending.
  - No hidden destructive actions.

## 3. Information Architecture

### Portal nav targets

- Dashboard
- Events
- Vault
- Pay
- Security (MFA)

### Public nav targets

- Home
- About
- Programs
- Events
- News
- Contact
- Internal Brothers Only

## 4. Feature-by-Feature UI/UX Plan

## Phase B (First): MFA Enrollment UX

Objective: remove dead-end redirects and provide a complete, guided setup flow.

Screens:
1. Security gate redirect state (`/security/mfa`)
2. Enrollment state (QR shown)
3. Verification state (6-digit code entry)
4. Success state (redirect to dashboard)
5. Already-enrolled state

UX requirements:
- Explain why MFA is required for role access.
- Provide short, actionable setup instructions.
- Show clear error messages for invalid code/challenge failures.
- Prevent submission until code length is valid.
- Preserve keyboard-friendly focus order.

Acceptance checks:
- Admin/Treasurer/Intake Director reaching protected pages are routed to `/security/mfa`.
- Completing verification returns user to usable portal path.

## Phase A: Document Vault UX

Objective: make chapter documents discoverable, role-correct, and safe to manage.

Screens:
1. Vault list page grouped by category
2. Download interaction with pending/error states
3. Upload page (officer-only)
4. Soft-delete control for authorized officers

UX requirements:
- Category group headings with human-readable labels.
- Upload CTA visible only when role allows write access.
- Upload form filters categories by role:
  - Admin: bylaws, financials, minutes
  - Secretary: bylaws, minutes
  - Treasurer: bylaws, financials
- Show filename/title and created date in list rows.
- Destructive action requires explicit confirmation.
- Empty state copy when no docs exist.

Critical interaction constraints:
- Upload progress and metadata save are treated as two steps in messaging.
- If metadata save fails, show non-technical error text; cleanup remains server-side.

Acceptance checks:
- Each officer role only sees categories they can actually write.
- Download works only when RLS conditions are met.
- Remove action immediately reflects in list after refresh/revalidate.

## Phase C: Payments UX

Objective: deliver a trustworthy, low-friction checkout for dues, event fees, and donations.

Screens:
1. Payment page shell
2. Card entry state (Square Web Payments container)
3. Pending processing state
4. Success receipt state
5. Failure/retry state

UX requirements:
- Payment type selector: dues, event fee, donation.
- Amount input with clear USD labeling and validation feedback.
- Distinct trust text near button (secure processing by Square).
- Persistent error area for card tokenize/payment failures.
- Button locked while processing.

Webhook-informed states:
- UI confirms immediate result from charge attempt.
- Future enhancement: transaction history card that reflects webhook-updated statuses.

Acceptance checks:
- End-to-end sandbox payment can be completed from portal.
- Confirmation copy displayed on success.
- Failures provide retry path without page reload.

## Phase D: Transactional Email UX

Objective: make automated emails feel official, readable, and brand-consistent.

Templates:
1. Intake received
2. Payment confirmation
3. Meeting reminder

Content standards:
- Plain, concise subject lines.
- Intro paragraph naming chapter and purpose.
- One clear next step or expectation.
- Footer identity and support/contact direction.

Visual standards:
- High contrast text.
- Single-column card layout.
- Minimal decorative styling to preserve client compatibility.

Acceptance checks:
- Test sends render correctly on mobile and desktop clients.
- No layout breaks in dark-mode mail clients.

## Phase E: Rate Limit UX

Objective: convert hard technical limits into understandable user feedback.

Touchpoints:
- Public join flow
- Health endpoint consumers (developer-facing)
- Any future form/action using `checkRateLimit`

UX requirements:
- Friendly message when throttled: short explanation and retry guidance.
- Avoid exposing internals (provider names, raw keys).
- Where possible include cooldown hint (e.g., “Try again in about a minute”).

Acceptance checks:
- Rate-limited paths return meaningful user-facing feedback copy.
- No generic crash/error boundary shown for expected throttling.

## Phase F: News/CMS UX

Objective: provide chapter-scoped publishing with a polished reading experience.

Experiences:
1. Studio authoring workflow (internal)
2. Public news list (`/news`)
3. Public news detail (`/news/[slug]`)

UX requirements:
- News list cards: title, publish date, short excerpt, cover image optional.
- Detail page: readable typography, proper heading hierarchy, comfortable line length.
- Tenant scoping behavior is invisible to user but consistent in output.
- Add News item to public header nav.

Acceptance checks:
- Post appears only on intended chapter site.
- Detail pages render rich text cleanly on mobile and desktop.

## 5. Shared Component Checklist

Create/reuse these primitives once to reduce design drift:

- Section header block (eyebrow + title + supporting text)
- Form field block (label + control + inline error)
- Primary action button (default/pending/disabled)
- Empty state panel
- Success notice panel
- Danger action row with confirmation
- List row with metadata + trailing actions

## 6. Accessibility and Responsiveness Standards

- Minimum touch target: 44x44 for primary controls.
- Visible focus state on all interactive elements.
- Color contrast meets WCAG AA.
- Mobile-first layouts; no horizontal overflow at 320px width.
- Status messages announced in a consistent region where practical.

## 7. UI Verification Pass (per feature)

For each shipped feature, run:

1. Functional checks in desktop + mobile viewport
2. Role-based visibility checks (Member, Secretary, Treasurer, Admin)
3. Error-state checks (network failure, validation failure, unauthorized)
4. Build quality gates:
   - `npx tsc --noEmit -p tsconfig.json`
   - `rm -rf .next && npm run build`
   - `npm run lint`

## 8. Delivery Milestones

Milestone 1: Security unblock
- MFA enrollment flow + redirect fixes complete and validated.

Milestone 2: Member operations
- Vault list/download/upload/delete complete with role-correct UX.
- Portal nav includes Vault.

Milestone 3: Payments
- Pay page and Square checkout flow complete.
- Portal nav includes Pay.

Milestone 4: Communications and reliability
- Intake email + payment confirmation template shipped.
- Upstash rate limit integration surfaced with human-friendly errors.

Milestone 5: Content platform
- Sanity setup, News list/detail pages, public nav update.

## 9. Immediate Next UI Task

Start with MFA UX implementation and review before additional UI work:

- Build src/app/(portal)/security/mfa/page.tsx
- Build src/app/(portal)/security/mfa/enroll-form.tsx
- Update role-guard redirect handling in [src/lib/auth/rbac.ts](src/lib/auth/rbac.ts) and portal call sites

This sequence eliminates the current lockout risk and unlocks all role-gated QA for later phases.