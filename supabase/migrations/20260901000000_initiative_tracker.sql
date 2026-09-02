create table if not exists public.initiative_submissions (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id),
  initiative text not null check (initiative in ('black_spending', 'steps')),
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 120),
  business_name text,
  black_owned_confirmed boolean,
  amount_cents integer,
  spent_on date,
  steps integer,
  distance_miles numeric(7,2),
  tracked_on date,
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  evidence_path text not null,
  evidence_content_type text not null,
  evidence_size_bytes integer not null,
  cleanup_token_hash text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  constraint black_spending_fields check (initiative <> 'black_spending' or (business_name is not null and black_owned_confirmed = true and amount_cents > 0 and spent_on is not null)),
  constraint steps_fields check (initiative <> 'steps' or (steps > 0 and tracked_on is not null))
);
create index if not exists initiative_submissions_month_idx on public.initiative_submissions (chapter_id, initiative, created_at) where is_deleted = false;
alter table public.initiative_submissions enable row level security;
create policy "public reads active initiative submissions" on public.initiative_submissions for select using (is_deleted = false);
insert into storage.buckets (id, name, public) values ('initiative-evidence', 'initiative-evidence', false) on conflict (id) do nothing;
