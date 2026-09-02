create table if not exists public.scholarship_applications (
  id uuid primary key default gen_random_uuid(), chapter_id uuid not null references public.chapters(id),
  applicant jsonb not null, essays text not null, files jsonb not null, status text not null default 'received' check (status in ('received','reviewing','finalist','awarded','declined')),
  created_at timestamptz not null default now()
);
alter table public.scholarship_applications enable row level security;
create policy "no public scholarship reads" on public.scholarship_applications for select using (false);
insert into storage.buckets (id, name, public) values ('scholarship-applications', 'scholarship-applications', false) on conflict (id) do nothing;
