# Sanity CMS setup

Sanity is the content editor for chapter news. Once connected, authorized editors can create and publish posts in the Studio; the `/news` pages fetch published content at runtime, so adding a new post does not require a code change.

## One-time setup

1. Create or open a Sanity project at [sanity.io/manage](https://www.sanity.io/manage).
2. Create a dataset named `production` (or choose another dataset name).
3. Copy the project ID into `.env.local`:

   ```env
   SANITY_PROJECT_ID=your-project-id
   SANITY_DATASET=production
   ```

   `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` are also supported if you prefer the public-name convention.

4. Restart the dev server after changing environment variables.
5. Open `http://localhost:3000/studio` and sign in with the Sanity account that has access to the project.

The Studio is already embedded in the Next.js app. No Sanity CLI deployment is required for local use.

## Publishing a news post

1. Open `/studio`.
2. Choose **Post**.
3. Enter a title and generate a slug.
4. Set **Chapter** to `root` for the main Birmingham Sigmas site.
5. Add a publication date, cover image, and body content.
6. Click **Publish**.
7. Open `/news` and confirm the post appears.

Only published documents appear through the public Sanity API. Drafts remain available in Studio and are not shown to visitors.

## Collegiate posts

When a collegiate chapter is configured in `CHAPTER_SLUG_MAP`, create its posts with the matching chapter slug, such as `miles`. The existing News query filters posts by the active tenant’s chapter slug.

## Troubleshooting

- `Dataset "production" not found`: the dataset name does not exist in the Sanity project. Create it or make `SANITY_DATASET` match the actual dataset.
- `project ID "placeholder"`: the app did not receive either `SANITY_PROJECT_ID` or `NEXT_PUBLIC_SANITY_PROJECT_ID`; update `.env.local` and restart dev mode.
- Studio loads but publishing is denied: add your Sanity account as a project member with editor permission.
- A post is published but does not appear: check its chapter slug, confirm it is published rather than a draft, and refresh after the CDN cache window.
