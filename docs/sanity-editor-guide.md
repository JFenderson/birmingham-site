# Sanity editor guide

This guide is for editors using `/studio` to manage public chapter content.

Sanity is for public editorial content only:

- public news posts
- public community events
- public photo galleries and cover images
- public video links and thumbnails

Do not use Sanity for private member files, chapter minutes, financials, or anything that belongs in the Supabase member vault. The member vault is the protected `/vault` workflow inside the authenticated portal. Sanity content is intended for public website routes such as `/news`, `/community-events`, `/photos`, and `/media`.

## First-time checklist

Before your first edit, confirm all of the following:

1. You can sign in to `/studio`.
2. The project is using the correct Sanity dataset, usually `production`.
3. Your chapter appears in the `Chapter` dropdown.
4. You know whether your content belongs to `root` or a collegiate chapter.
5. You have final public-ready copy, image files, captions, and meaningful alt text.
6. For videos, you have a public `https://` YouTube or Vimeo URL and a thumbnail image with alt text.
7. You know which public page should update after publishing:
   - posts: `/news`
   - events: `/community-events`
   - galleries: `/photos` and `/media`
   - videos: `/media`

## Choosing the right chapter

Every editorial document requires a `Chapter` value.

- Choose `Root chapter (root)` for the main Birmingham Sigmas site.
- Choose the matching collegiate slug for chapter-specific content, such as `miles`, when that chapter is configured.

If the wrong chapter is selected, the content can publish successfully but appear on the wrong tenant site or not appear where you expected.

## Drafts, previewing, and publishing

This repo does not currently provide a separate secret public draft-preview URL. The safe workflow is:

1. Build and review the content inside `/studio`.
2. Leave `Publicly visible` turned off while drafting, or keep the publication date blank until the content is ready.
3. When the content is final, turn on `Publicly visible`, set the publication date if that document type requires it, and publish.
4. Check the public route after publishing:
   - `/news`
   - `/community-events`
   - `/photos`
   - `/media`

For scheduled launches, set a future `Publication date`. Public pages only show eligible content after the scheduled time has passed.

## Writing meaningful alt text

Every public image needs meaningful alt text. This includes:

- post cover images
- gallery cover images
- every gallery photo
- video thumbnails

Write alt text for someone who cannot see the image. Good alt text describes the important subject, action, or context in plain language.

Good examples:

- `Brothers posing with school supply donations outside the community center`
- `Chapter president speaking at the scholarship banquet podium`
- `Volunteers unloading boxes of shoes for students`

Avoid:

- `image`
- `photo`
- repeating the visible caption word-for-word when the caption does not explain the image
- keyword stuffing
- leaving alt text blank

If an image asset is uploaded without alt text, the schema validation blocks publishing, and public rendering intentionally omits blank-alt images.

## Creating a post

Use a `Post` for public news and editorial updates.

1. Open `/studio` and create a `Post`.
2. Enter the public headline in `Title`.
3. Generate or edit the `Slug`.
4. Choose the correct `Chapter`.
5. Leave `Publicly visible` off while drafting.
6. Add an optional `Cover image`, with meaningful alt text if you upload one.
7. Add the required `Excerpt`.
8. Add the article `Body`.
9. When ready, turn on `Publicly visible`.
10. Set `Publication date`.
11. Publish and verify the result on `/news`.

## Creating a community event

Use `Community Event` for outreach programs or public event cards shown on `/community-events`.

1. Create a `Community Event` in `/studio`.
2. Add the public `Title`.
3. Add the public `Description`.
4. Choose the correct `Chapter`.
5. Set `Display order`. Lower numbers appear first.
6. Turn on `Publicly visible` when the event card is ready for the public site.
7. Optionally set `Publication date` if you want the event to appear later.
8. Publish and verify the result on `/community-events`.

If no Sanity events are published for a chapter, the site can fall back to built-in default community event cards. Publishing chapter events replaces that empty-state fallback for the active chapter.

## Creating a gallery

Use `Gallery` for public photo collections that should appear on `/photos` and `/media`.

1. Create a `Gallery`.
2. Add the `Title`.
3. Generate or edit the `Slug`.
4. Choose the correct `Chapter`.
5. Leave `Publicly visible` off while drafting.
6. Set the `Event date`.
7. Add the required `Description`.
8. Upload the required `Cover image` and add alt text.
9. Add at least one item in `Photos`.
10. For each photo:
    - upload the image
    - add optional `Caption`
    - add required `Alt text`
11. Arrange the photos in the order you want them shown publicly.
12. Turn on `Publicly visible`.
13. Set `Publication date`.
14. Publish and verify:
    - `/photos` for the full gallery
    - `/media` for the gallery highlight card

## Creating a video entry

Use `Video` for public video links shown on `/media`. Do not upload large video files into this repo, into Sanity as file assets, or into Supabase Storage for public editorial use.

1. Create a `Video`.
2. Add the public `Title`.
3. Choose the correct `Chapter`.
4. Leave `Publicly visible` off while drafting.
5. Choose the `Provider`.
6. Paste the `Video URL`.
7. Upload the required `Thumbnail` and add alt text.
8. Add an optional `Description`.
9. Turn on `Publicly visible`.
10. Set `Publication date`.
11. Publish and verify the result on `/media`.

Supported video URLs:

- `https://www.youtube.com/...`
- `https://youtube.com/...`
- `https://youtu.be/...`
- `https://www.vimeo.com/...`
- `https://vimeo.com/...`

Notes:

- Only `https://` URLs are supported.
- The provider must match the URL domain.
- Non-YouTube and non-Vimeo links are rejected.
- Unsafe or unsupported video links will not render as public watch links.

## Publishing checklist

Before you click Publish, confirm:

1. The correct chapter is selected.
2. `Publicly visible` is turned on.
3. The publication date is correct.
4. Every public image has meaningful alt text.
5. Every gallery photo has alt text.
6. Video provider and URL match.
7. The content is ready for a public audience.

## After publishing

Public changes usually appear quickly, but Sanity content can take a short CDN refresh window to show up everywhere. A good post-publish check is:

1. Refresh the public page once.
2. Wait a minute or two if the old content is still showing.
3. Recheck the exact route for the content type.
4. Confirm the chapter selection and publication date if it still does not appear.

## Troubleshooting

`/studio` does not load:
Add `NEXT_PUBLIC_SANITY_PROJECT_ID` to `.env.local`, confirm the Sanity project exists, and restart the app.

`Dataset "production" not found`:
Create the dataset in Sanity Manage or change the configured dataset values so they match a real dataset.

You can sign in but cannot publish:
Ask a project administrator to add your Sanity account as a project member with editor access or higher.

Your chapter is missing from the chapter dropdown:
The local app config likely needs an updated `CHAPTER_SLUG_MAP`. Ask the site maintainer to refresh the environment configuration and restart the app.

The content published but is not visible publicly:
Check the chapter, `Publicly visible`, publication date, and the correct public route. Then allow a short CDN refresh window.

Your uploaded image is missing on the public site:
Check the image alt text. Blank-alt public images are intentionally skipped by the public rendering layer.

You are unsure whether a file belongs in Sanity or Supabase:
Use Sanity for public web content and public image assets. Use the authenticated `/vault` flow for private member files and protected chapter documents.
