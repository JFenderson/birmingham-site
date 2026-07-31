create table public.chapter_members (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id),
  profile_id uuid not null references public.profiles(id),
  role public.member_role not null default 'Member',
  status text not null default 'active' check (status in ('active','inactive','alumni','suspended')),
  joined_at timestamptz not null default now(),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter_id, profile_id)
);

create index chapter_members_chapter_idx on public.chapter_members (chapter_id) where is_deleted = false;
create index chapter_members_profile_idx on public.chapter_members (profile_id);

create trigger chapter_members_set_updated_at
  before update on public.chapter_members
  for each row execute function public.set_updated_at();

alter table public.chapter_members enable row level security;

create policy "chapter_members_read_own_chapter" on public.chapter_members
  for select using (
    chapter_id in (select public.current_chapter_ids()) and is_deleted = false
  );

create policy "chapter_members_officer_insert" on public.chapter_members
  for insert with check (
    public.has_role(chapter_id, array['Admin','Secretary']::public.member_role[])
  );

create policy "chapter_members_officer_update" on public.chapter_members
  for update using (
    public.has_role(chapter_id, array['Admin','Secretary']::public.member_role[])
  ) with check (
    public.has_role(chapter_id, array['Admin','Secretary']::public.member_role[])
  );

-- No delete policy: hard deletes are denied entirely, use is_deleted instead.
-- audit_row_change() trigger for this table is attached in
-- 00000000000010_audit_logs.sql, once that function exists.
