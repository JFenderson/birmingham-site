# Sanity Editorial and Media Design

## Goal

Allow authorized editors to publish public news, photo galleries, events, and video links without code changes.

## Design

Sanity remains the public editorial CMS. Supabase Storage remains for private member documents and protected chapter files. Sanity image assets power public photos and gallery covers; videos are represented by trusted YouTube/Vimeo URLs with thumbnails rather than large repository files.

## Content Types

- Post: title, slug, chapter slug, publication date, cover image, body, excerpt, published status.
- Gallery: title, slug, chapter slug, event/date, description, cover image, ordered photos with captions and alt text, published status.
- Video: title, chapter slug, provider, URL, thumbnail, description, publication date, published status.

## Editorial Rules

Every public image requires meaningful alt text. Drafts never appear on public pages. Chapter slug is required so tenant pages cannot display another chapter's content. The Studio must expose clear field descriptions and validation for editors who have not used Sanity before.
