-- Extensions and shared helper functions used by every later migration.

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

create type public.member_role as enum (
  'Member', 'Treasurer', 'Secretary', 'Intake Director', 'Admin'
);

-- Chapter IDs the current authenticated user belongs to (active membership
-- only). security definer so RLS policies on chapter_members can call it
-- without recursing into chapter_members' own RLS.
create or replace function public.current_chapter_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select cm.chapter_id
  from public.chapter_members cm
  where cm.profile_id = (select auth.uid())
    and cm.is_deleted = false;
$$;

-- True if the current user holds one of p_roles in p_chapter_id.
create or replace function public.has_role(p_chapter_id uuid, p_roles public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chapter_members cm
    where cm.profile_id = (select auth.uid())
      and cm.chapter_id = p_chapter_id
      and cm.role = any(p_roles)
      and cm.is_deleted = false
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
