# Sanity CMS setup

Sanity is the content editor for chapter news. Once connected, authorized editors can create and publish posts in the Studio; the `/news` pages fetch published content at runtime, so adding a new post does not require a code change.

## One-time setup

1. Create or open a Sanity project at [sanity.io/manage](https://www.sanity.io/manage).
2. In that project, create a dataset named `production`.
3. Open the Sanity project’s **Members** settings and add each editor who should be able to publish content. Grant at least editor-level access.
4. Copy the project ID and dataset into `.env.local`:

   ```env
   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
   NEXT_PUBLIC_SANITY_DATASET=production
   ```

   `NEXT_PUBLIC_SANITY_DATASET` is the value used by the browser and the embedded Studio, so set it explicitly to the dataset you want `/studio` and client-side Sanity code to read.

   If you want matching server-side aliases for local development or tests, set the server values to the same dataset:

   ```env
   SANITY_PROJECT_ID=your-project-id
   SANITY_DATASET=production
   ```

   Keep `SANITY_DATASET` aligned with `NEXT_PUBLIC_SANITY_DATASET` so server-side reads and browser/Studio reads point at the same dataset.

   `/studio` requires `NEXT_PUBLIC_SANITY_PROJECT_ID`. The app no longer uses a fallback project ID.

5. Restart the dev server after changing environment variables.
6. Open `http://localhost:3000/studio` and sign in with a Sanity account that has access to the project.

The Studio is already embedded in the Next.js app. No Sanity CLI deployment is required for local use.

## Publishing a news post

1. Open `/studio`.
2. Choose **Post**.
3. Enter a title and generate a slug.
4. Set **Chapter** to `root` for the main Birmingham Sigmas site.
5. Add a publication date, cover image, and body content.
6. Click **Publish**.
7. Open `/news` and confirm the post appears.

For a first end-to-end smoke test, publish a simple welcome post in the `production` dataset and confirm it appears on `/news` for the correct chapter.

Only published documents appear through the public Sanity API. Drafts remain available in Studio and are not shown to visitors.

## Collegiate posts

When a collegiate chapter is configured in `CHAPTER_SLUG_MAP`, create its posts with the matching chapter slug, such as `miles`. The existing News query filters posts by the active tenant’s chapter slug.

## Troubleshooting

- `Dataset "production" not found`: the dataset name does not exist in the Sanity project. Create it, then make `NEXT_PUBLIC_SANITY_DATASET` match that dataset and keep `SANITY_DATASET` aligned with it.
- `/studio` says `NEXT_PUBLIC_SANITY_PROJECT_ID` is required: add the public project ID to `.env.local` and restart dev mode. The embedded Studio cannot load from a server-only variable alone.
- Public fetches fail because Sanity is not configured: set `NEXT_PUBLIC_SANITY_PROJECT_ID` or `SANITY_PROJECT_ID`, then restart dev mode. For dataset mismatches, make sure `NEXT_PUBLIC_SANITY_DATASET` is set for browser/Studio usage and that `SANITY_DATASET` uses the same value for server-side reads.
- Studio loads but publishing is denied: add your Sanity account as a project member with editor permission.
- A post is published but does not appear: check its chapter slug, confirm it is published rather than a draft, and refresh after the CDN cache window.
