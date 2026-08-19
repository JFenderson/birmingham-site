# Sanity CMS setup

Sanity is the public editorial CMS for chapter news, community events, photo galleries, public video links, the Sigma Beta Club program, and the Tau Sigma Charity Foundation. Once connected, authorized editors can use the embedded Studio at `/studio`, and the public routes update from published Sanity content without code changes:

- `/news` for posts
- `/community-events` for chapter events
- `/photos` for full gallery pages
- `/media` for gallery highlights plus videos
- `/sigma-beta-club` for Sigma Beta Club settings, events, and advisors
- `/foundation` for Tau Sigma Charity Foundation settings, projects, events, and board members

Use Sanity only for public-facing editorial content and public image assets. Keep private member documents and protected chapter files in the Supabase-backed member vault, not in Sanity.

## One-time setup

1. Create or open a Sanity project at [sanity.io/manage](https://www.sanity.io/manage).
2. In that project, create a dataset named `production`.
3. Open the project’s **Members** settings and add each editor who should be able to work in `/studio`. Grant at least editor-level access.
4. Copy the Sanity values into `.env.local`:

   ```env
   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
   NEXT_PUBLIC_SANITY_DATASET=production
   SANITY_PROJECT_ID=your-project-id
   SANITY_DATASET=production
   ```

   `NEXT_PUBLIC_SANITY_PROJECT_ID` is required for `/studio` because the Studio loads in the browser.

   `NEXT_PUBLIC_SANITY_DATASET` is the browser-facing dataset used by `/studio` and other client-side Sanity tooling.

   `SANITY_PROJECT_ID` and `SANITY_DATASET` keep server-side reads aligned with the browser configuration. Keep the dataset values the same unless you are intentionally testing a different non-public dataset.

5. If this repo needs chapter-specific editorial options beyond `root`, make sure `CHAPTER_SLUG_MAP` is present and up to date in `.env.local`. The Studio reads that map to build the chapter selector list for posts, events, galleries, and videos.
6. Restart the dev server after any environment change.
7. Open `http://localhost:3000/studio` and sign in with a Sanity account that has access to the configured project.

The Studio is already embedded in the Next.js app. No separate Sanity Studio deployment is required for local use.

## First publish smoke test

1. Open `/studio`.
2. Create a simple `Post`.
3. Add a title, slug, chapter, excerpt, and body content.
4. Turn on `Publicly visible`.
5. Set `Publication date` to now or a past date.
6. Publish the document.
7. Open `/news` and confirm the post appears on the correct chapter site.

If that works, the same project and dataset are ready for the rest of the editorial document types.

## Sigma Beta Club and Foundation form notifications

The public interest form on `/sigma-beta-club` and the public information-request form on `/foundation` send confirmation and admin notification emails through Resend, the same provider used for the intake flow described in `docs/resend-setup.md`. They use two additional optional server-only environment variables:

- `SIGMA_BETA_ADMIN_EMAIL`: chapter recipient for Sigma Beta Club interest-form admin notifications.
- `FOUNDATION_ADMIN_EMAIL`: chapter recipient for Foundation information-request admin notifications.

Both forms reuse the existing `RESEND_API_KEY` and `EMAIL_FROM` values documented in `docs/resend-setup.md`. If `SIGMA_BETA_ADMIN_EMAIL` or `FOUNDATION_ADMIN_EMAIL` is not set, the corresponding admin notification is skipped without error; the submitter's own confirmation email still sends. Neither form ever creates a Supabase account, member record, or authentication user.

Donations on `/foundation` are not part of this email setup. The `Donation URL` field in `Tau Sigma Charity Foundation Settings` only stores a link to the chapter's existing approved external or Square donation destination; Sanity and this codebase never process payments.

## Editorial guide

For the full editor workflow, including Sigma Beta Club and Foundation content, use `docs/sanity-editor-guide.md`. It covers the first-time checklist, chapter selection, posts, events, galleries, videos, Sigma Beta Club and Foundation documents, alt text, draft handling, public routes, and troubleshooting. See `docs/sigma-beta-foundation-editor-guide.md` for a focused first-content checklist for `/sigma-beta-club` and `/foundation`.

## Troubleshooting

- `Dataset "production" not found`: create the dataset in Sanity Manage, then make `NEXT_PUBLIC_SANITY_DATASET` and `SANITY_DATASET` match it exactly.
- `/studio` says `NEXT_PUBLIC_SANITY_PROJECT_ID` is required: add that value to `.env.local` and restart dev mode. A server-only project ID is not enough for the embedded Studio.
- Public Sanity reads fail because configuration is missing: set `NEXT_PUBLIC_SANITY_PROJECT_ID` or `SANITY_PROJECT_ID`, set the dataset values, and restart the app.
- `/studio` loads but you cannot publish or edit: add your Sanity account as a project member with editor permission or higher.
- The chapter dropdown only shows `root`: update `CHAPTER_SLUG_MAP` in `.env.local`, restart the app, and reopen `/studio`.
- A published item does not appear on the expected page: confirm the correct chapter slug, confirm `Publicly visible` is on, confirm the publication date is not in the future, and allow a short CDN refresh window before rechecking the public route.
- Images are not rendering publicly: make sure the image has meaningful alt text. Public image rendering intentionally skips blank alt text.
- `/sigma-beta-club` or `/foundation` shows an empty state: publish a `Sigma Beta Club Settings` or `Tau Sigma Charity Foundation Settings` document for the current chapter first; other content types depend on it.
- A Sigma Beta Club or Foundation form submission is not producing an admin email: confirm `SIGMA_BETA_ADMIN_EMAIL` or `FOUNDATION_ADMIN_EMAIL` is set. This is optional; when unset, only the admin notification is skipped, not the submitter's confirmation.
