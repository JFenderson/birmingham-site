# Sigma Beta Club and Foundation editor guide

This is a focused first-content checklist and troubleshooting reference for the `/sigma-beta-club` and `/foundation` public pages. It assumes you already know the general Sanity workflow (signing in, choosing a chapter, drafts, publication dates, alt text). For that general workflow, read `docs/sanity-editor-guide.md` first; this doc only covers what is specific to these two pages.

## First content checklist: `/sigma-beta-club`

The page is chapter-scoped: it looks for content matching the current chapter's slug. Publish in this order.

1. Publish a `Sigma Beta Club Settings` document for your chapter. This is required first — the page shows a neutral empty state until this document exists, is `Publicly visible`, and has a publication date that is not in the future. It must include a required `Overview`, `Mission`, `Hero image` with alt text, `Program director contact`, and `Interest form introduction`.
2. Optionally publish one or more `Sigma Beta Club Event` documents for the same chapter. Each needs a required `Event image` with alt text.
3. Optionally add `Advisors` directly inside the settings document. Advisor portraits are optional, but any portrait you upload needs alt text.
4. Reload `/sigma-beta-club` for your chapter and confirm the hero, overview, mission, director contact, advisors, events, and interest form all appear as expected.

Events and advisors are secondary content. Without a published settings document, they will not cause the page to render — the empty state takes priority.

## First content checklist: `/foundation`

Same pattern, different document types.

1. Publish a `Tau Sigma Charity Foundation Settings` document for your chapter first. It must include the required `Nonprofit name`, `501(c)(3) statement`, `Purpose`, `Overview`, `Donation URL`, `Information request introduction`, `Contact email`, and `Hero image` with alt text.
2. Optionally publish `Foundation Project` documents. Each needs a required `Project image` with alt text; any additional gallery images also need alt text.
3. Optionally publish `Foundation Event` documents.
4. Optionally publish `Foundation Board Member` documents. Each needs a required `Portrait` with alt text. Board member documents do not have a `Publication date` field — only `Publicly visible` controls whether they show up.
5. Reload `/foundation` for your chapter and confirm the hero, overview, purpose, tax-status statement, donate button, projects, events, board members, and information-request form all appear as expected.

## Public forms never create accounts

Both the Sigma Beta Club interest form and the Foundation information-request form are public-facing, rate-limited, and validated with Zod. Neither form, on any submission path, ever:

- creates a Supabase account
- creates a member record
- creates an authentication user

A successful submission only does two things: send a confirmation email to the submitter, and send an admin notification email to the chapter's configured recipient, if one is configured. See `docs/resend-setup.md` and the "Sigma Beta Club and Foundation form notifications" section of `docs/sanity-setup.md` for the underlying Resend setup.

Each form also has a hidden honeypot field. If a bot fills it in, the form returns the same neutral success message a real visitor would see, but skips sending any email at all — no confirmation, no admin notification.

## Donations are processed entirely outside Sanity

The `Donation URL` field on `Tau Sigma Charity Foundation Settings` stores a single link: the chapter's existing, already-approved external or Square donation destination. That is the only thing Sanity or this codebase does with donations.

- Sanity does not process payments.
- Sanity does not handle card data.
- This codebase does not call the Square API directly.
- The `/foundation` donate button is a plain external link built from that stored URL.

The URL must be either an internal `/`-path or an `https://` URL to render. If `Donation URL` is missing or fails that safe-link check, the donate button does not render at all — a text fallback appears in its place instead of a broken or unsafe link.

Registration URLs on `Sigma Beta Club Event` and `Foundation Event` documents follow the identical rule: internal `/`-path or `https://` URL only. A blank or unsafe registration URL simply means no registration link is rendered for that event; it does not block the rest of the event card from showing.

## Troubleshooting

`/sigma-beta-club` shows the generic empty state:
No `Sigma Beta Club Settings` document is published for the current chapter, or it is still a draft, or its publication date is in the future. Publish a settings document with `Publicly visible` on and a past or current publication date.

`/foundation` shows the generic empty state:
Same cause, but for `Tau Sigma Charity Foundation Settings`. Publish a settings document for the current chapter first.

An interest-form or information-request submission does not produce an admin email:
This is expected if `SIGMA_BETA_ADMIN_EMAIL` (Sigma Beta Club) or `FOUNDATION_ADMIN_EMAIL` (Foundation) is not set in the environment. The admin notification is skipped without error. The submitter's own confirmation email still sends normally. This is not a bug — set the corresponding environment variable and restart the app if you want admin notifications.

The donate button is missing on `/foundation`:
Check `Donation URL` on the foundation settings document. It must be filled in and must be either a `/`-path or an `https://` URL. If it fails either check, the button is intentionally not shown and a text fallback renders instead.

A registration link is missing on an event card:
Same rule as the donate button. Check that `Registration URL` is filled in and is a `/`-path or `https://` URL. A blank field is normal if registration is not open yet; simply leave it blank until it is.

Content is published but shows on the wrong chapter's page, or does not show at all:
Check the `Chapter` field on the document. It must match the current site's configured chapter slug. See "Choosing the right chapter" in `docs/sanity-editor-guide.md`.

A document was left as a draft:
Documents with `Publicly visible` off never appear publicly, regardless of chapter or content completeness. Turn it on and publish.

A document has a future publication date:
Public routes only show content once its publication date has passed. Set the date to now or earlier to make it visible immediately. Foundation board member documents do not have a publication date field, so only `Publicly visible` matters for them.

Publishing is blocked with a missing alt text error:
Every image field on these document types (hero images, event images, project images and gallery photos, board member and advisor portraits) requires alt text once an image is uploaded. Add alt text describing the image content, then publish again. This is enforced the same way as the alt text rules for posts, galleries, and videos described in `docs/sanity-editor-guide.md`.
