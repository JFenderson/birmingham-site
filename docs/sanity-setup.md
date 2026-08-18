# Sanity CMS setup

Sanity is the public editorial CMS for chapter news, community events, photo galleries, and public video links. Once connected, authorized editors can use the embedded Studio at `/studio`, and the public routes update from published Sanity content without code changes:

- `/news` for posts
- `/community-events` for chapter events
- `/photos` for full gallery pages
- `/media` for gallery highlights plus videos

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

## Editorial guide

For the full editor workflow, use `docs/sanity-editor-guide.md`. It covers the first-time checklist, chapter selection, posts, events, galleries, videos, alt text, draft handling, public routes, and troubleshooting.

## Troubleshooting

- `Dataset "production" not found`: create the dataset in Sanity Manage, then make `NEXT_PUBLIC_SANITY_DATASET` and `SANITY_DATASET` match it exactly.
- `/studio` says `NEXT_PUBLIC_SANITY_PROJECT_ID` is required: add that value to `.env.local` and restart dev mode. A server-only project ID is not enough for the embedded Studio.
- Public Sanity reads fail because configuration is missing: set `NEXT_PUBLIC_SANITY_PROJECT_ID` or `SANITY_PROJECT_ID`, set the dataset values, and restart the app.
- `/studio` loads but you cannot publish or edit: add your Sanity account as a project member with editor permission or higher.
- The chapter dropdown only shows `root`: update `CHAPTER_SLUG_MAP` in `.env.local`, restart the app, and reopen `/studio`.
- A published item does not appear on the expected page: confirm the correct chapter slug, confirm `Publicly visible` is on, confirm the publication date is not in the future, and allow a short CDN refresh window before rechecking the public route.
- Images are not rendering publicly: make sure the image has meaningful alt text. Public image rendering intentionally skips blank alt text.
