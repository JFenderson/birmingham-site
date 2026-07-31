create table public.events (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id),
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location_name text,
  geofence_lat double precision,
  geofence_lng double precision,
  geofence_radius_m integer,
  created_by uuid references public.profiles(id),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_chapter_starts_idx on public.events (chapter_id, starts_at) where is_deleted = false;

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

alter table public.events enable row level security;

create policy "events_read_own_chapter" on public.events
  for select using (
    chapter_id in (select public.current_chapter_ids()) and is_deleted = false
  );

create policy "events_officer_insert" on public.events
  for insert with check (
    public.has_role(chapter_id, array['Admin','Secretary']::public.member_role[])
  );

create policy "events_officer_update" on public.events
  for update using (
    public.has_role(chapter_id, array['Admin','Secretary']::public.member_role[])
  ) with check (
    public.has_role(chapter_id, array['Admin','Secretary']::public.member_role[])
  );
