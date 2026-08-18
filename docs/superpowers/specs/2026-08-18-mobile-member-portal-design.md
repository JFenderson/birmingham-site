# Mobile-First Member Portal Design

## Goal

Make the authenticated member portal feel like a branded mobile-first app while remaining comfortable on desktop.

## Design

The existing authorization, MFA, routes, and data access remain unchanged. The portal layout becomes a responsive shell with a branded header, desktop sidebar, and mobile bottom navigation. Regular member tools are grouped separately from officer tools. Existing pages are progressively restyled with shared cards, page headers, status badges, forms, tables, loading states, and empty states.

## Navigation

Primary navigation: Home, Events, Vault, Pay, Account. Chapter Tools contains Intake, Invite Brother, and Admin only when the current role permits them. The mobile bottom bar contains the five primary destinations; chapter tools remain in the profile/menu drawer.

## Constraints

- Root and collegiate authorization behavior must not change.
- MFA redirects and permission-denied behavior must remain intact.
- The portal must remain usable at 320px viewport width.
- Desktop layout begins at the existing Tailwind `lg` breakpoint.
- No new UI dependency is required.
