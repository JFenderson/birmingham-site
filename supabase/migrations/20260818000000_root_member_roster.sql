-- Protected root/Tau Sigma roster used only for member-access verification.
-- Source workbook rows are imported separately through a controlled local
-- process; no workbook data belongs in Git or public storage.

create table public.root_member_roster (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete restrict,
  membership_number text not null,
  membership_number_normalized text not null,
  first_name text not null,
  middle_name text,
  last_name text not null,
  last_name_normalized text not null,
  roster_email text,
  status text not null default 'active'
    check (status in ('active','inactive','transferred','deceased','unknown')),
  claimed_profile_id uuid references public.profiles(id) on delete restrict,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (membership_number_normalized),
  constraint root_member_roster_membership_number_not_blank
    check (length(btrim(membership_number)) > 0),
  constraint root_member_roster_membership_number_normalized
    check (
      membership_number_normalized =
      upper(regexp_replace(btrim(membership_number), '\s+', '', 'g'))
    ),
  constraint root_member_roster_last_name_not_blank
    check (length(btrim(last_name)) > 0),
  constraint root_member_roster_last_name_normalized
    check (
      last_name_normalized =
      lower(regexp_replace(btrim(last_name), '\s+', ' ', 'g'))
    ),
  constraint root_member_roster_claimed_profile_has_timestamp
    check (
      (claimed_profile_id is null and claimed_at is null)
      or (claimed_profile_id is not null and claimed_at is not null)
    )
);

create unique index root_member_roster_claimed_profile_uidx
  on public.root_member_roster (claimed_profile_id)
  where claimed_profile_id is not null;

create index root_member_roster_chapter_idx
  on public.root_member_roster (chapter_id);

create index root_member_roster_lookup_idx
  on public.root_member_roster (
    membership_number_normalized,
    last_name_normalized
  )
  where status = 'active' and claimed_profile_id is null;

create trigger root_member_roster_set_updated_at
  before update on public.root_member_roster
  for each row execute function public.set_updated_at();

create or replace function public.enforce_root_member_roster_chapter()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.chapters
    where chapters.id = new.chapter_id
      and chapters.slug = 'root'
      and chapters.type = 'graduate'
  ) then
    raise exception 'root member roster rows must belong to root chapter'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger root_member_roster_enforce_root_chapter
  before insert or update of chapter_id on public.root_member_roster
  for each row execute function public.enforce_root_member_roster_chapter();

revoke all on function public.enforce_root_member_roster_chapter() from public;

alter table public.root_member_roster enable row level security;

-- No public read policy: member-access verification uses the service-role
-- server path in src/lib/roster/verify-root-member.ts and returns only a
-- neutral match result.
create policy "root_member_roster_admin_read" on public.root_member_roster
  for select using (
    public.is_chapter_admin_for(chapter_id)
  );

-- No public insert/delete policy: imports and future maintenance use reviewed
-- service-role tooling. Admin updates are limited to approved root admins by
-- the same profile-backed boundary used elsewhere in the portal.
create policy "root_member_roster_admin_update_claim" on public.root_member_roster
  for update using (
    public.is_chapter_admin_for(chapter_id)
  ) with check (
    public.is_chapter_admin_for(chapter_id)
  );
