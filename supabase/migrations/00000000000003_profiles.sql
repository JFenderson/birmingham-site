create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_self_read" on public.profiles
  for select using ((select auth.uid()) = id);

create policy "profiles_self_update" on public.profiles
  for update using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Fellow chapter members can read each other's basic profile (roster views).
create policy "profiles_chapter_peer_read" on public.profiles
  for select using (
    id in (
      select cm2.profile_id from public.chapter_members cm2
      where cm2.chapter_id in (select public.current_chapter_ids())
        and cm2.is_deleted = false
    )
  );

-- Auto-create a profile row on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
