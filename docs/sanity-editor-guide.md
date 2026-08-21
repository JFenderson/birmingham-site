# Sanity editor guide

This guide is for editors using `/studio` to manage public chapter content.

Sanity is for public editorial content only:

- public news posts
- public community events
- public photo galleries and cover images
- public video links and thumbnails
- public Sigma Beta Club program settings, events, and advisors
- public Tau Sigma Charity Foundation settings, projects, events, and board members

Do not use Sanity for private member files, chapter minutes, financials, or anything that belongs in the Supabase member vault. The member vault is the protected `/vault` workflow inside the authenticated portal. Sanity content is intended for public website routes such as `/news`, `/community-events`, `/photos`, `/media`, `/sigma-beta-club`, and `/foundation`.

Sanity never handles payment processing, card data, or Square API calls. The Foundation's `Donation URL` field only stores a link to the chapter's existing approved external or Square donation destination; the actual transaction happens entirely outside this codebase.

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
   - Sigma Beta Club settings, events, advisors: `/sigma-beta-club`
   - Foundation settings, projects, events, board members: `/foundation`

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
- Sigma Beta Club hero images, event images, and advisor portraits
- Foundation hero images, project images and gallery photos, and board member portraits

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

## Creating a leader

Use a `Leader` for a brother displayed on the public leadership page.

1. Create a `Leader` in `/studio` and choose the correct `Chapter`.
2. Add the brother's public `Name`, `Role`, and optional portrait/bio.
3. Choose the `Public leadership section`: `Executive Board`, `Committee Chairmen`, or `Fraternity Leadership`.
4. If the section is `Fraternity Leadership`, choose the level: `State`, `Regional`, or `International`.
5. Set the display `Order`, turn on `Publicly visible`, add a publication date if prompted, and publish.

The public page displays Executive Board first, followed by Committee Chairmen, then Fraternity Leadership grouped by State, Regional, and International. Existing leader records without a section continue to display in Executive Board for backward compatibility.

## Creating a post

Use a `Post` for public news and editorial updates.

1. Open `/studio` and create a `Post`.
2. Enter the public headline in `Title`.
3. Generate or edit the `Slug`.
4. Choose the correct `Chapter`.
5. Leave `Publicly visible` off while drafting.
6. Add an optional `Cover image`, with meaningful alt text if you upload one.
7. For an article with multiple photos, add them in the ordered `Article gallery` field. Add alt text for every photo and an optional caption. The article page keeps the cover image as the hero and shows the gallery below the article when two or more gallery photos are present.
8. Add the required `Excerpt`.
9. Add the article `Body`.
10. When ready, turn on `Publicly visible`.
11. Set `Publication date`.
12. Publish and verify the result on `/news`, then open the article to verify its photos.

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

## Creating Sigma Beta Club content

The Sigma Beta Club page at `/sigma-beta-club` is chapter-scoped. It shows a neutral empty state until a `Sigma Beta Club Settings` document is published for that chapter, so publish settings first.

### Sigma Beta Club settings

There is normally one `Sigma Beta Club Settings` document per chapter.

1. Create a `Sigma Beta Club Settings` document in `/studio`.
2. Choose the correct `Chapter`.
3. Leave `Publicly visible` off while drafting.
4. Add the required `Overview`.
5. Add the required `Mission`.
6. Upload the required `Hero image` and add alt text.
7. Fill in `Program director contact`: required `Director name or label`, required `Director email`, and optional `Director phone`.
8. Optionally add one or more `Advisors`. For each advisor, add the required `Name` and `Role`, an optional `Bio`, and an optional `Portrait` with alt text if you upload one.
9. Add the required `Interest form introduction` shown above the public interest form.
10. When ready, turn on `Publicly visible`.
11. Set `Publication date`.
12. Publish and verify the result on `/sigma-beta-club`.

### Sigma Beta Club events

1. Create a `Sigma Beta Club Event` in `/studio`.
2. Add the public `Title`.
3. Generate or edit the `Slug`.
4. Add the required `Description`.
5. Set the required `Event date`.
6. Add the required `Location`.
7. Optionally add a `Registration URL`. Use a site path such as `/sigma-beta-club` or an `https://` URL; unsafe or blank values mean no registration link renders.
8. Upload the required `Event image` and add alt text.
9. Choose the correct `Chapter`.
10. Set `Display order`. Lower numbers appear first.
11. Turn on `Publicly visible` when ready.
12. Optionally set `Publication date` for a scheduled launch.
13. Publish and verify the result on `/sigma-beta-club`.

### Sigma Beta Club interest form

The public interest form on `/sigma-beta-club` collects name, email, optional phone, role (student, parent, or guardian), and message. It is rate-limited and validated before it sends anything.

A successful submission never creates a Supabase account, member record, or authentication user. It only sends a confirmation email to the submitter and, if `SIGMA_BETA_ADMIN_EMAIL` is configured, an admin notification email. If that environment variable is not set, the admin notification is silently skipped and the submitter still receives their confirmation.

The form includes a hidden honeypot field. If it is filled in (a bot behavior), the form returns the same neutral success message a real submitter would see, but no confirmation or admin email is sent.

## Creating Tau Sigma Charity Foundation content

The Foundation page at `/foundation` is chapter-scoped the same way. It shows a neutral empty state until a `Tau Sigma Charity Foundation Settings` document is published for that chapter, so publish settings first.

### Foundation settings

There is normally one `Tau Sigma Charity Foundation Settings` document per chapter.

1. Create a `Tau Sigma Charity Foundation Settings` document in `/studio`.
2. Choose the correct `Chapter`.
3. Leave `Publicly visible` off while drafting.
4. Add the required `Nonprofit name`.
5. Add the required `501(c)(3) statement`.
6. Add the required `Purpose`.
7. Add the required `Overview`.
8. Add the required `Donation URL`. Use a site path such as `/foundation` or the chapter's approved Square or external HTTPS donation link. This is a plain link only; Sanity and this codebase never process payments or card data.
9. Add the required `Information request introduction` shown above the public information-request form.
10. Add the required `Contact email`.
11. Upload the required `Hero image` and add alt text.
12. When ready, turn on `Publicly visible`.
13. Set `Publication date`.
14. Publish and verify the result on `/foundation`, including that the donate button appears and points to the correct destination.

If `Donation URL` is missing, or fails the safe-link check (not an internal `/`-path and not an `https://` URL), the donate button does not render. A text fallback appears instead, so the page never shows a broken or dangerous link.

### Foundation projects

1. Create a `Foundation Project` in `/studio`.
2. Add the public `Title`.
3. Add the required `Description`.
4. Set the required `Project date`.
5. Add the required `Project type`, such as scholarship or community service.
6. Upload the required `Project image` and add alt text.
7. Optionally add `Additional images`. Add alt text for every image you upload; unpublished blank-alt images will block publishing.
8. Choose the correct `Chapter`.
9. Set `Display order`. Lower numbers appear first.
10. Turn on `Publicly visible` when ready.
11. Optionally set `Publication date`.
12. Publish and verify the result on `/foundation`.

### Foundation events

1. Create a `Foundation Event` in `/studio`.
2. Add the public `Title`.
3. Add the required `Description`.
4. Set the required `Event date`.
5. Add the required `Location`.
6. Optionally add a `Registration URL`. Use a site path such as `/foundation` or an `https://` URL; unsafe or blank values mean no registration link renders.
7. Choose the correct `Chapter`.
8. Set `Display order`. Lower numbers appear first.
9. Turn on `Publicly visible` when ready.
10. Optionally set `Publication date`.
11. Publish and verify the result on `/foundation`.

### Foundation board members

1. Create a `Foundation Board Member` in `/studio`.
2. Add the public `Name`.
3. Add the public `Role`.
4. Optionally add a `Bio`.
5. Upload the required `Portrait` and add alt text.
6. Choose the correct `Chapter`.
7. Set `Display order`. Lower numbers appear first.
8. Turn on `Publicly visible` when ready. This document type does not have a `Publication date` field; publish visibility is controlled by `Publicly visible` alone.
9. Publish and verify the result on `/foundation`.

### Foundation information-request form

The public information-request form on `/foundation` collects name, email, optional organization, optional phone, and message. It is rate-limited and validated before it sends anything.

A successful submission never creates a Supabase account, member record, or authentication user. It only sends a confirmation email to the submitter and, if `FOUNDATION_ADMIN_EMAIL` is configured, an admin notification email. If that environment variable is not set, the admin notification is silently skipped and the submitter still receives their confirmation.

The form includes a hidden honeypot field. If it is filled in, the form returns the same neutral success message a real submitter would see, but no confirmation or admin email is sent.

## Publishing checklist

Before you click Publish, confirm:

1. The correct chapter is selected.
2. `Publicly visible` is turned on.
3. The publication date is correct.
4. Every public image has meaningful alt text.
5. Every gallery photo has alt text.
6. Video provider and URL match.
7. Donation and registration URLs are internal `/`-paths or `https://` URLs.
8. For Sigma Beta Club and Foundation settings documents, the required contact fields (director contact, foundation contact email, donation URL) are filled in.
9. The content is ready for a public audience.

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

`/sigma-beta-club` or `/foundation` shows a generic empty state instead of your content:
This is the intentional chapter-neutral empty state that renders when no `Sigma Beta Club Settings` or `Tau Sigma Charity Foundation Settings` document is published for the current chapter. Publish a settings document for that chapter first; events, advisors, projects, board members, and other secondary content only appear once settings is published.

Missing Sanity environment variables affects these pages too:
`/sigma-beta-club` and `/foundation` read from the same Sanity project and dataset as the rest of the site. The generic `NEXT_PUBLIC_SANITY_PROJECT_ID` / dataset troubleshooting above applies here as well.

Your chapter has no Sigma Beta Club or Foundation configuration:
Confirm `CHAPTER_SLUG_MAP` includes the chapter, and confirm a settings document with a matching `Chapter` value has been published. A missing or mismatched chapter slug on the settings document is the most common cause of an unexpected empty state.

You left a Sigma Beta Club or Foundation document as a draft:
Draft documents (with `Publicly visible` off) never appear on public routes. Turn on `Publicly visible` and publish when the content is ready.

A Sigma Beta Club or Foundation document has a future `Publication date`:
Public pages only show eligible content after the scheduled publication time has passed. Set the date to now or the past if you want it visible immediately.

The donate button or a registration link is missing:
This is expected, not a bug, when the URL is blank or fails the safe-link check. Only an internal `/`-path or an `https://` URL renders as a link; anything else is silently omitted along with a text fallback where applicable.

A Sigma Beta Club interest or Foundation information-request submission did not send an admin notification:
Check whether `SIGMA_BETA_ADMIN_EMAIL` (Sigma Beta Club) or `FOUNDATION_ADMIN_EMAIL` (Foundation) is set. If either is unset, the admin notification is intentionally skipped; the submitter still receives their own confirmation email and no error occurs.
