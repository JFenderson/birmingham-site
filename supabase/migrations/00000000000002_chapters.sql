create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  type text not null check (type in ('graduate', 'collegiate')),
  parent_chapter_id uuid references public.chapters(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index chapters_slug_idx on public.chapters (slug);

create trigger chapters_set_updated_at
  before update on public.chapters
  for each row execute function public.set_updated_at();

alter table public.chapters enable row level security;

-- Public read: subdomain -> chapter name resolution must work for
-- unauthenticated visitors on public landing pages.
create policy "chapters_public_read" on public.chapters
  for select using (true);

create policy "chapters_admin_write" on public.chapters
  for all using (
    public.has_role(id, array['Admin']::public.member_role[])
  ) with check (
    public.has_role(id, array['Admin']::public.member_role[])
  );
