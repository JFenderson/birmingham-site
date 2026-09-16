-- Ordinary approved members (including officers browsing member content) may
-- use password or email sign-in at AAL1. Officer operations require AAL2.
-- Restrictive policies AND with existing role/chapter policies, not replace them.

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'chapters', 'root_member_roster', 'chapter_members', 'events', 'transactions', 'documents',
    'prospective_members', 'prospective_member_notes', 'attendance_logs'
  ] loop
    execute format('create policy officer_mfa_insert on public.%I as restrictive for insert to authenticated with check ((select auth.jwt()->>''aal'') = ''aal2'')', target_table);
    execute format('create policy officer_mfa_update on public.%I as restrictive for update to authenticated using ((select auth.jwt()->>''aal'') = ''aal2'') with check ((select auth.jwt()->>''aal'') = ''aal2'')', target_table);
    execute format('create policy officer_mfa_delete on public.%I as restrictive for delete to authenticated using ((select auth.jwt()->>''aal'') = ''aal2'')', target_table);
  end loop;
end;
$$;

create policy intake_mfa_read on public.prospective_members
  as restrictive for select to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2');
create policy roster_mfa_read on public.root_member_roster
  as restrictive for select to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2');
create policy audit_mfa_read on public.audit_logs
  as restrictive for select
  using ((select auth.jwt()->>'aal') = 'aal2');
create policy intake_notes_mfa_read on public.prospective_member_notes
  as restrictive for select to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2');
create policy financial_mfa_read on public.transactions
  as restrictive for select to authenticated
  using (profile_id = (select auth.uid()) or (select auth.jwt()->>'aal') = 'aal2');
create policy documents_mfa_read on public.documents
  as restrictive for select to authenticated
  using (
    (select auth.jwt()->>'aal') = 'aal2'
    or (category in ('bylaws', 'minutes') and 'Member'::public.member_role = any(visible_to_roles))
  );
create policy vault_mfa_read on storage.objects
  as restrictive for select to authenticated
  using (
    bucket_id not in ('bylaws', 'minutes', 'financials')
    or (select auth.jwt()->>'aal') = 'aal2'
    or exists (
      select 1 from public.documents d
      where d.storage_bucket = bucket_id and d.storage_path = name
        and d.category in ('bylaws', 'minutes')
        and 'Member'::public.member_role = any(d.visible_to_roles)
        and not d.is_deleted
    )
  );
create policy vault_mfa_insert on storage.objects
  as restrictive for insert to authenticated
  with check (bucket_id not in ('bylaws', 'minutes', 'financials') or (select auth.jwt()->>'aal') = 'aal2');

-- Keep self/approved-peer profile reads available. Viewing pending or suspended
-- accounts through the admin API requires MFA in addition to existing policies.
create policy profiles_mfa_read on public.profiles
  as restrictive for select to authenticated
  using (id = (select auth.uid()) or membership_status = 'approved' or (select auth.jwt()->>'aal') = 'aal2');
create policy profiles_mfa_update on public.profiles
  as restrictive for update to authenticated
  using (id = (select auth.uid()) or (select auth.jwt()->>'aal') = 'aal2')
  with check (id = (select auth.uid()) or (select auth.jwt()->>'aal') = 'aal2');

-- The self-update policy must not bypass MFA for authorization changes.
create or replace function public.protect_profile_authorization_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor public.profiles%rowtype;
begin
  if new.chapter_id is not distinct from old.chapter_id
     and new.membership_status is not distinct from old.membership_status
     and new.role is not distinct from old.role
     and new.approved_at is not distinct from old.approved_at
     and new.approved_by is not distinct from old.approved_by then return new; end if;

  -- Trusted provisioning performs pending roster claims through the service API.
  if auth.role() = 'service_role' then return new; end if;
  if coalesce(auth.jwt()->>'aal', '') <> 'aal2' then
    raise exception 'MFA required for authorization changes' using errcode = '42501';
  end if;
  select p.* into actor from public.profiles p where p.id = (select auth.uid());
  if actor.membership_status = 'approved' and actor.role = 'super_admin' then return new; end if;
  if actor.membership_status = 'approved' and actor.role = 'chapter_admin'
     and actor.chapter_id = old.chapter_id and new.chapter_id is not distinct from old.chapter_id
     and old.role <> 'super_admin' and new.role <> 'super_admin' then return new; end if;
  raise exception 'member authorization fields cannot be changed by this user' using errcode = '42501';
end;
$$;

-- Secretary membership management must not become an alternative promotion path.
create or replace function public.protect_legacy_role_assignment()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if tg_op = 'UPDATE' then
    if new.role is not distinct from old.role
       and new.chapter_id is not distinct from old.chapter_id
       and new.profile_id is not distinct from old.profile_id then return new; end if;
  elsif new.role = 'Member' then return new;
  end if;
  if coalesce(auth.jwt()->>'aal', '') <> 'aal2'
     or not public.is_chapter_admin_for(new.chapter_id)
     or new.profile_id = auth.uid() then
    raise exception 'administrator approval required for officer assignments' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' then
    if not public.is_chapter_admin_for(old.chapter_id) or old.profile_id = auth.uid() then
      raise exception 'cannot change this officer assignment' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
create trigger chapter_members_protect_role_assignment
  before insert or update on public.chapter_members
  for each row execute function public.protect_legacy_role_assignment();
revoke all on function public.protect_legacy_role_assignment() from public, anon, authenticated;
