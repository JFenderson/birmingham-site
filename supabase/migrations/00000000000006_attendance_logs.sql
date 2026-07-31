create table public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id),
  event_id uuid not null references public.events(id),
  profile_id uuid not null references public.profiles(id),
  checked_in_at timestamptz not null default now(),
  check_in_lat double precision,
  check_in_lng double precision,
  distance_from_geofence_m double precision,
  created_at timestamptz not null default now(),
  unique (event_id, profile_id)
);

create index attendance_logs_chapter_event_idx on public.attendance_logs (chapter_id, event_id);
create index attendance_logs_profile_idx on public.attendance_logs (profile_id);

alter table public.attendance_logs enable row level security;

create policy "attendance_logs_read_own_chapter" on public.attendance_logs
  for select using (chapter_id in (select public.current_chapter_ids()));

-- The real geofence-validated insert path is a later phase's service-role
-- Server Action (validation must run server-side, not client RLS). Phase 1
-- only lets officers seed rows directly.
create policy "attendance_logs_officer_insert" on public.attendance_logs
  for insert with check (
    public.has_role(chapter_id, array['Admin','Secretary']::public.member_role[])
  );

-- No update/delete policy: attendance is append-only/immutable once logged.
