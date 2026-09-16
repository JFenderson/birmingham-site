-- Make the database, rather than the web UI, the authority for sensitive data.

-- Public pages receive a server-computed aggregate. They must never query
-- individual initiative submissions through the Data API.
drop policy if exists "public reads active initiative submissions" on public.initiative_submissions;
alter table public.initiative_submissions
  add column if not exists review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected')),
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id),
  add column if not exists review_note text;
alter table public.initiative_submissions
  add constraint initiative_review_metadata_consistent check (
    (review_status = 'pending' and reviewed_at is null and reviewed_by is null)
    or (review_status in ('approved', 'rejected') and reviewed_at is not null and reviewed_by is not null)
  );
create index if not exists initiative_submissions_review_queue_idx
  on public.initiative_submissions (chapter_id, review_status, created_at)
  where is_deleted = false;

-- A metadata row must describe a real object in its own chapter and category.
create or replace function public.validate_document_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() <> 'service_role' and new.uploaded_by is distinct from auth.uid() then
    raise exception 'document uploader must be the authenticated user' using errcode = '42501';
  end if;
  if new.category not in ('bylaws', 'financials', 'minutes')
     or new.storage_bucket <> new.category
     or new.storage_path !~ ('^' || new.chapter_id::text || '/[^/]+$') then
    raise exception 'document bucket, category, and chapter path must agree' using errcode = '23514';
  end if;
  if new.category = 'financials'
    and not (coalesce(new.visible_to_roles, array[]::public.member_role[]) <@ array['Treasurer','Admin']::public.member_role[]) then
    raise exception 'financial documents must be visible only to Treasurer and Admin' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger documents_validate_metadata
  before insert or update on public.documents
  for each row execute function public.validate_document_metadata();
revoke all on function public.validate_document_metadata() from public, anon, authenticated;

create or replace function public.can_write_document(
  p_chapter_id uuid,
  p_category text
) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case p_category
    when 'financials' then public.has_role(p_chapter_id, array['Treasurer','Admin']::public.member_role[])
    when 'bylaws' then public.has_role(p_chapter_id, array['Secretary','Treasurer','Admin']::public.member_role[])
    when 'minutes' then public.has_role(p_chapter_id, array['Secretary','Admin']::public.member_role[])
    else false
  end;
$$;
create policy documents_category_write on public.documents
  as restrictive for insert to authenticated
  with check (public.can_write_document(chapter_id, category));
create policy documents_category_update on public.documents
  as restrictive for update to authenticated
  using (public.can_write_document(chapter_id, category))
  with check (public.can_write_document(chapter_id, category));

-- Notes cannot be forged onto another chapter's applicant or another officer.
create or replace function public.validate_prospective_member_note()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare applicant_chapter uuid;
begin
  select chapter_id into applicant_chapter
  from public.prospective_members where id = new.prospective_member_id;
  if applicant_chapter is null or applicant_chapter <> new.chapter_id then
    raise exception 'note and prospective member must belong to the same chapter' using errcode = '23514';
  end if;
  if auth.role() <> 'service_role' and new.author_id is distinct from auth.uid() then
    raise exception 'note author must be the authenticated user' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger prospective_member_notes_validate_ownership
  before insert on public.prospective_member_notes
  for each row execute function public.validate_prospective_member_note();
revoke all on function public.validate_prospective_member_note() from public, anon, authenticated;

-- The generic audit helper is for trusted triggers/service jobs only; it is
-- not an API callable by anonymous or authenticated browser clients.
revoke all on function public.log_audit_event(uuid, uuid, text, text, uuid, inet, jsonb)
  from public, anon, authenticated;
grant execute on function public.log_audit_event(uuid, uuid, text, text, uuid, inet, jsonb)
  to service_role;

create or replace function public.log_service_audit_event(
  p_chapter_id uuid,
  p_user_id uuid,
  p_action text,
  p_target_table text,
  p_target_id uuid,
  p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  if length(p_action) > 120 or length(p_target_table) > 120
     or jsonb_typeof(p_metadata) <> 'object' then
    raise exception 'invalid audit event' using errcode = '22023';
  end if;
  insert into public.audit_logs (chapter_id, user_id, action, target_table, target_id, metadata)
  values (p_chapter_id, p_user_id, p_action, p_target_table, p_target_id, p_metadata);
end;
$$;
revoke all on function public.log_service_audit_event(uuid, uuid, text, text, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.log_service_audit_event(uuid, uuid, text, text, uuid, jsonb)
  to service_role;

create or replace function public.audit_profile_authorization_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.chapter_id is distinct from old.chapter_id
     or new.membership_status is distinct from old.membership_status
     or new.role is distinct from old.role
     or new.approved_at is distinct from old.approved_at
     or new.approved_by is distinct from old.approved_by then
    insert into public.audit_logs (chapter_id, user_id, action, target_table, target_id, metadata)
    values (
      coalesce(new.chapter_id, old.chapter_id), auth.uid(), 'profiles.authorization_update',
      'profiles', new.id,
      jsonb_build_object(
        'previous_status', old.membership_status,
        'next_status', new.membership_status,
        'previous_role', old.role,
        'next_role', new.role
      )
    );
  end if;
  return new;
end;
$$;
create trigger profiles_audit_authorization_change
  after update on public.profiles
  for each row execute function public.audit_profile_authorization_change();
revoke all on function public.audit_profile_authorization_change() from public, anon, authenticated;

-- An invite sent to the roster email is a temporary reservation, not a
-- permanent way for somebody who knows a roster number to lock an account.
create or replace function public.expire_unaccepted_root_claims()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare affected integer;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  with expired as (
    update public.root_member_roster r
    set claimed_profile_id = null, claimed_at = null
    from public.profiles p
    where p.id = r.claimed_profile_id
      and r.claimed_at < now() - interval '7 days'
      and p.membership_status = 'pending'
    returning p.id
  ) select count(*) into affected from expired;
  return affected;
end;
$$;
revoke all on function public.expire_unaccepted_root_claims() from public, anon, authenticated;
grant execute on function public.expire_unaccepted_root_claims() to service_role;
