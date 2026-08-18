-- Service-role only helper used by the public root member access request flow.
-- Supabase Auth creates the invited user first; this function then claims the
-- verified roster row and updates the profile in one locked database
-- transaction. A false return is intentionally neutral for duplicate races.

create or replace function public.claim_root_member_access_request(
  p_roster_id uuid,
  p_profile_id uuid,
  p_chapter_id uuid,
  p_full_name text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  roster_row public.root_member_roster%rowtype;
begin
  if auth.role() <> 'service_role' then
    raise exception 'claim_root_member_access_request requires service role'
      using errcode = '42501';
  end if;

  select r.* into roster_row
  from public.root_member_roster r
  join public.chapters c on c.id = r.chapter_id
  where r.id = p_roster_id
    and r.chapter_id = p_chapter_id
    and c.slug = 'root'
    and c.type = 'graduate'
    and r.status = 'active'
    and r.claimed_profile_id is null
  for update of r;

  if not found then
    return false;
  end if;

  if exists (
    select 1
    from public.root_member_roster r
    where r.claimed_profile_id = p_profile_id
  ) then
    return false;
  end if;

  update public.profiles p
  set
    full_name = p_full_name,
    chapter_id = p_chapter_id,
    membership_status = 'pending'::public.membership_status,
    role = 'member'::public.access_role,
    approved_at = null,
    approved_by = null
  where p.id = p_profile_id;

  if not found then
    return false;
  end if;

  update public.root_member_roster
  set
    claimed_profile_id = p_profile_id,
    claimed_at = now()
  where id = p_roster_id
    and claimed_profile_id is null;

  return found;
end;
$$;

revoke all on function public.claim_root_member_access_request(
  uuid,
  uuid,
  uuid,
  text
) from public;

grant execute on function public.claim_root_member_access_request(
  uuid,
  uuid,
  uuid,
  text
) to service_role;
