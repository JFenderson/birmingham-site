-- Profile-backed member approval and global/chapter administration.
-- The existing chapter_members roles remain in place for officer-specific
-- capabilities; these fields are the coarse access boundary for the portal.

create type public.membership_status as enum (
  'pending', 'approved', 'suspended'
);

create type public.access_role as enum (
  'member', 'chapter_admin', 'super_admin'
);

alter table public.profiles
  add column chapter_id uuid references public.chapters(id) on delete restrict,
  add column membership_status public.membership_status not null default 'pending',
  add column role public.access_role not null default 'member',
  add column approved_at timestamptz,
  add column approved_by uuid references public.profiles(id) on delete set null;

-- Preserve access for existing active members. A profile can historically
-- have multiple chapter_members rows, so prefer its active membership and
-- then the earliest membership as a deterministic primary chapter.
with ranked_memberships as (
  select
    cm.profile_id,
    cm.chapter_id,
    cm.role,
    cm.status,
    cm.joined_at,
    row_number() over (
      partition by cm.profile_id
      order by
        case cm.status
          when 'active' then 0
          when 'suspended' then 1
          else 2
        end,
        cm.joined_at,
        cm.id
    ) as membership_rank
  from public.chapter_members cm
  where cm.is_deleted = false
)
update public.profiles p
set
  chapter_id = rm.chapter_id,
  membership_status = case rm.status
    when 'active' then 'approved'::public.membership_status
    when 'suspended' then 'suspended'::public.membership_status
    else 'pending'::public.membership_status
  end,
  role = case rm.role
    when 'Admin' then 'chapter_admin'::public.access_role
    else 'member'::public.access_role
  end,
  approved_at = case
    when rm.status = 'active' then rm.joined_at
    else null
  end
from ranked_memberships rm
where p.id = rm.profile_id
  and rm.membership_rank = 1;

alter table public.profiles
  add constraint profiles_chapter_admin_has_chapter
    check (role <> 'chapter_admin' or chapter_id is not null),
  add constraint profiles_approved_member_has_chapter
    check (
      membership_status <> 'approved'
      or role = 'super_admin'
      or chapter_id is not null
    ),
  add constraint profiles_approved_member_has_timestamp
    check (membership_status <> 'approved' or approved_at is not null),
  add constraint profiles_approver_requires_timestamp
    check (approved_by is null or approved_at is not null);

create index profiles_chapter_membership_idx
  on public.profiles (chapter_id, membership_status);

create index profiles_access_role_idx
  on public.profiles (role)
  where role <> 'member';

-- SECURITY DEFINER avoids recursive profile RLS checks. Each helper exposes
-- only a boolean or the caller's own chapter identifier.
create or replace function public.is_approved_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.membership_status = 'approved'
  );
$$;

create or replace function public.current_member_chapter_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.chapter_id
  from public.profiles p
  where p.id = (select auth.uid())
    and p.membership_status = 'approved'
  limit 1;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.membership_status = 'approved'
      and p.role = 'super_admin'
  );
$$;

create or replace function public.is_chapter_admin_for(p_chapter_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.membership_status = 'approved'
      and (
        p.role = 'super_admin'
        or (p.role = 'chapter_admin' and p.chapter_id = p_chapter_id)
      )
  );
$$;

-- Bridge the approval boundary into every legacy policy that relies on
-- current_chapter_ids() or has_role(). Super admins are global; a new
-- chapter_admin is equivalent to the legacy Admin role only in its chapter.
create or replace function public.current_chapter_ids()
returns setof uuid
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.is_super_admin() then
    return query select c.id from public.chapters c;
    return;
  end if;

  return query
    select cm.chapter_id
    from public.chapter_members cm
    join public.profiles p on p.id = cm.profile_id
    where cm.profile_id = (select auth.uid())
      and cm.is_deleted = false
      and p.membership_status = 'approved'
      and p.chapter_id = cm.chapter_id;
end;
$$;

create or replace function public.has_role(
  p_chapter_id uuid,
  p_roles public.member_role[]
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.is_super_admin() then
    return true;
  end if;

  if public.is_chapter_admin_for(p_chapter_id)
     and 'Admin'::public.member_role = any(p_roles) then
    return true;
  end if;

  return exists (
    select 1
    from public.chapter_members cm
    join public.profiles p on p.id = cm.profile_id
    where cm.profile_id = (select auth.uid())
      and cm.chapter_id = p_chapter_id
      and cm.role = any(p_roles)
      and cm.is_deleted = false
      and p.membership_status = 'approved'
      and p.chapter_id = cm.chapter_id
  );
end;
$$;

drop policy if exists "profiles_chapter_peer_read" on public.profiles;

create policy "profiles_approved_chapter_read" on public.profiles
  for select using (
    public.is_approved_member()
    and membership_status = 'approved'
    and chapter_id = public.current_member_chapter_id()
  );

create policy "profiles_admin_read" on public.profiles
  for select using (public.is_chapter_admin_for(chapter_id));

create policy "profiles_admin_update" on public.profiles
  for update using (public.is_chapter_admin_for(chapter_id))
  with check (public.is_chapter_admin_for(chapter_id));

-- RLS can limit rows but cannot compare OLD and NEW values. This trigger
-- prevents the existing self-update policy from becoming a role-escalation
-- path while still allowing members to edit safe profile fields.
create or replace function public.protect_profile_authorization_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles%rowtype;
begin
  if new.chapter_id is not distinct from old.chapter_id
     and new.membership_status is not distinct from old.membership_status
     and new.role is not distinct from old.role
     and new.approved_at is not distinct from old.approved_at
     and new.approved_by is not distinct from old.approved_by then
    return new;
  end if;

  select p.* into actor
  from public.profiles p
  where p.id = (select auth.uid());

  if actor.membership_status = 'approved'
     and actor.role = 'super_admin' then
    return new;
  end if;

  if actor.membership_status = 'approved'
     and actor.role = 'chapter_admin'
     and actor.chapter_id = old.chapter_id
     and new.chapter_id is not distinct from old.chapter_id
     and new.role <> 'super_admin' then
    return new;
  end if;

  raise exception 'member authorization fields cannot be changed by this user'
    using errcode = '42501';
end;
$$;

create trigger profiles_protect_authorization_fields
  before update on public.profiles
  for each row execute function public.protect_profile_authorization_fields();

revoke all on function public.protect_profile_authorization_fields() from public;
