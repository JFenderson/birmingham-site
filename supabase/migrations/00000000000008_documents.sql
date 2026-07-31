-- Metadata only. Actual files live in Supabase Storage (see
-- 00000000000011_storage_buckets.sql). No upload/download UI in Phase 1.
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id),
  category text not null check (category in ('bylaws','financials','minutes','other')),
  title text not null,
  storage_bucket text not null,
  storage_path text not null,
  uploaded_by uuid references public.profiles(id),
  visible_to_roles public.member_role[] not null default array['Member','Treasurer','Secretary','Intake Director','Admin']::public.member_role[],
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_chapter_category_idx on public.documents (chapter_id, category) where is_deleted = false;

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

alter table public.documents enable row level security;

create policy "documents_role_scoped_read" on public.documents
  for select using (
    chapter_id in (select public.current_chapter_ids())
    and is_deleted = false
    and exists (
      select 1 from public.chapter_members cm
      where cm.profile_id = (select auth.uid())
        and cm.chapter_id = documents.chapter_id
        and cm.role = any(documents.visible_to_roles)
        and cm.is_deleted = false
    )
  );

create policy "documents_officer_insert" on public.documents
  for insert with check (
    public.has_role(chapter_id, array['Admin','Secretary','Treasurer']::public.member_role[])
  );

create policy "documents_officer_update" on public.documents
  for update using (
    public.has_role(chapter_id, array['Admin','Secretary','Treasurer']::public.member_role[])
  ) with check (
    public.has_role(chapter_id, array['Admin','Secretary','Treasurer']::public.member_role[])
  );
