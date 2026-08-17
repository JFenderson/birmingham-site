# Birmingham Sigmas Platform Design

## Goal

Evolve the existing Tau Sigma site into the primary Birmingham Sigmas public website with a cohesive member portal, administrator workspace, and multi-tenant foundation for future collegiate chapter subdomains.

## Product surfaces

### Public site

The public experience will use the approved royal-blue-and-white visual system and include the homepage, chapter history, leadership, programs, events, photos, news, contact, and calls to action for membership and community partnership. The existing public routes remain the source of truth for content navigation and are restyled with reusable sections rather than duplicated page-specific patterns.

### Member portal

Members authenticate through Supabase Auth and access a protected portal. New accounts are not treated as verified members automatically: an administrator approves membership and assigns a role. The portal will provide a dashboard, account settings, announcements, member-only documents in the existing vault, intake/payment workflows already present in the codebase, and clear states for pending, approved, and suspended access.

### Admin workspace

Administrators get a protected workspace for member approval, role management, chapter/content settings, announcements, news, events, photos, and audit-friendly status changes. Authorization is enforced server-side and through Supabase row-level security; UI visibility is not the security boundary. Admin actions should be validated with the existing schema utilities and use the current server action/API patterns.

### Collegiate microsites

The platform will be multi-tenant and host-aware. A shared collegiate template will render chapter-specific data such as name, subdomain, logo, colors, leadership, events, photos, news, and contact details. The first delivery focuses on the main Birmingham Sigmas site while preserving a clean chapter data model and host-resolution boundary for future subdomains such as `miles.birminghamsigmas.org`.

## Architecture

- Keep the existing Next.js App Router structure and public/portal route groups.
- Extend the existing tenant resolution layer so hostnames can resolve a chapter/site context without coupling pages to string parsing.
- Keep public content in Sanity where the current site already uses it; keep identity, roles, membership status, and protected records in Supabase.
- Add a small authorization layer with explicit role and membership-status checks reusable by pages, server actions, and route handlers.
- Reuse the existing document vault, intake, payment, and security routes instead of replacing them.
- Use shared visual primitives for public sections, portal cards/tables, admin controls, status badges, and responsive navigation.

## Data and permissions

The platform needs a member profile tied to the authenticated user, a membership status (`pending`, `approved`, `suspended`), and a role (`member`, `chapter_admin`, `super_admin`). Chapter records should own the tenant-specific branding and content relationship. Admin operations must record who performed the change and when where the existing schema supports it.

Permission rules:

- Anonymous users can read published public content only.
- Pending or suspended users cannot access member-only content.
- Approved members can access their own profile and member portal resources.
- Chapter admins can manage members and content scoped to their chapter.
- Super admins can manage all chapters and global settings.

## Error and edge states

The UI will provide explicit loading, empty, unauthorized, pending-approval, suspended, not-found, and server-error states. Hostnames that do not resolve to a configured tenant fall back safely to the main public site or a clear not-found response, depending on route type. Admin mutations must reject unauthorized requests even if invoked directly outside the UI.

## Delivery sequence

1. Establish the shared visual system and public Birmingham Sigmas shell.
2. Formalize tenant context and reusable content primitives.
3. Add member profile/status/role authorization and approval flows.
4. Build the member portal around the existing protected features.
5. Build the admin workspace and scoped management actions.
6. Add the shared collegiate template and host-based routing seam.
7. Verify with lint, production build, and focused authorization/route checks.

## Success criteria

- The main public site feels like a complete Birmingham Sigmas website rather than a starter homepage.
- A member can sign in, see the correct approval state, and reach protected resources only after approval.
- An administrator can approve members and manage scoped content without relying on client-side checks.
- The same codebase can render a future collegiate chapter from chapter data and a subdomain without copying the site implementation.
- Existing portal capabilities continue to build and function while the public experience is redesigned.
