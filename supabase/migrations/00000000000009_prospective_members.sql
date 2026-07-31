create table public.prospective_members (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id),
  full_name text not null,
  email text not null,
  phone text,
  pipeline_stage text not null default 'submitted'
    check (pipeline_stage in ('submitted','under_review','interview','approved','denied','reactivation','transfer')),
  form_type text not null check (form_type in ('intake','reactivation','transfer')),
  -- Raw zod-validated submission payload. PII-bearing: must be masked
  -- before it ever reaches a log line or client response.
  submitted_payload jsonb not null,
  reviewed_by uuid references public.profiles(id),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index prospective_members_chapter_idx on public.prospective_members (chapter_id) where is_deleted = false;
create index prospective_members_email_idx on public.prospective_members (email);

create trigger prospective_members_set_updated_at
  before update on public.prospective_members
  for each row execute function public.set_updated_at();

alter table public.prospective_members enable row level security;

-- No public select policy: applicants never read back submissions via the
-- client. Only officers review the pipeline.
create policy "prospective_members_intake_read" on public.prospective_members
  for select using (
    public.has_role(chapter_id, array['Intake Director','Admin']::public.member_role[]) and is_deleted = false
  );

create policy "prospective_members_intake_update" on public.prospective_members
  for update using (
    public.has_role(chapter_id, array['Intake Director','Admin']::public.member_role[])
  ) with check (
    public.has_role(chapter_id, array['Intake Director','Admin']::public.member_role[])
  );

-- No insert policy for anon/authenticated roles: the public form submission
-- path (a later phase) goes through a service-role Server Action after
-- zod validation + rate limiting, not a client-side RLS insert.
