-- Public forms create a short-lived server-side upload intent, then send
-- large files straight to Storage with signed one-time upload URLs. This
-- avoids raising Next's global Server Action request-body limit.
create table if not exists public.public_upload_intents (
  id uuid primary key,
  chapter_id uuid not null references public.chapters(id),
  kind text not null check (kind in ('scholarship', 'initiative')),
  payload jsonb not null,
  uploads jsonb not null,
  expires_at timestamptz not null,
  finalized_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.public_upload_intents enable row level security;
revoke all on table public.public_upload_intents from anon, authenticated;

create index if not exists public_upload_intents_expiry_idx
  on public.public_upload_intents (expires_at)
  where finalized_at is null;
