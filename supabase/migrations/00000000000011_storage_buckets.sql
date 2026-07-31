-- Document vault buckets, schema/policy only — no upload/download UI ships
-- in Phase 1. Object path convention: '{chapter_id}/{document_id}-{filename}'.

insert into storage.buckets (id, name, public) values
  ('bylaws', 'bylaws', false),
  ('financials', 'financials', false),
  ('minutes', 'minutes', false)
on conflict (id) do nothing;

create policy "bylaws_role_scoped_read" on storage.objects
  for select using (
    bucket_id = 'bylaws'
    and (storage.foldername(name))[1]::uuid in (select public.current_chapter_ids())
    and exists (
      select 1 from public.documents d
      join public.chapter_members cm on cm.chapter_id = d.chapter_id and cm.profile_id = (select auth.uid())
      where d.storage_bucket = 'bylaws'
        and d.storage_path = name
        and cm.role = any(d.visible_to_roles)
        and cm.is_deleted = false
        and d.is_deleted = false
    )
  );

create policy "bylaws_officer_write" on storage.objects
  for insert with check (
    bucket_id = 'bylaws'
    and public.has_role((storage.foldername(name))[1]::uuid, array['Admin','Secretary','Treasurer']::public.member_role[])
  );

create policy "financials_role_scoped_read" on storage.objects
  for select using (
    bucket_id = 'financials'
    and (storage.foldername(name))[1]::uuid in (select public.current_chapter_ids())
    and exists (
      select 1 from public.documents d
      join public.chapter_members cm on cm.chapter_id = d.chapter_id and cm.profile_id = (select auth.uid())
      where d.storage_bucket = 'financials'
        and d.storage_path = name
        and cm.role = any(d.visible_to_roles)
        and cm.is_deleted = false
        and d.is_deleted = false
    )
  );

-- Financials write is tighter: Treasurer/Admin only.
create policy "financials_officer_write" on storage.objects
  for insert with check (
    bucket_id = 'financials'
    and public.has_role((storage.foldername(name))[1]::uuid, array['Treasurer','Admin']::public.member_role[])
  );

create policy "minutes_role_scoped_read" on storage.objects
  for select using (
    bucket_id = 'minutes'
    and (storage.foldername(name))[1]::uuid in (select public.current_chapter_ids())
    and exists (
      select 1 from public.documents d
      join public.chapter_members cm on cm.chapter_id = d.chapter_id and cm.profile_id = (select auth.uid())
      where d.storage_bucket = 'minutes'
        and d.storage_path = name
        and cm.role = any(d.visible_to_roles)
        and cm.is_deleted = false
        and d.is_deleted = false
    )
  );

-- Minutes write is tighter: Secretary/Admin only.
create policy "minutes_officer_write" on storage.objects
  for insert with check (
    bucket_id = 'minutes'
    and public.has_role((storage.foldername(name))[1]::uuid, array['Secretary','Admin']::public.member_role[])
  );

-- No update/delete object policies: replacing a document means uploading a
-- new object and soft-deleting the old `documents` row.
