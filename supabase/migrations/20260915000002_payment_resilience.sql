create table public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id),
  profile_id uuid not null references public.profiles(id),
  client_request_id uuid not null,
  type text not null check (type in ('dues', 'event_fee', 'donation')),
  amount_cents bigint not null check (amount_cents between 100 and 1000000),
  status text not null default 'created' check (status in ('created', 'processing', 'completed', 'failed')),
  square_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter_id, profile_id, client_request_id),
  unique (square_payment_id)
);
create trigger payment_intents_set_updated_at before update on public.payment_intents
  for each row execute function public.set_updated_at();
alter table public.payment_intents enable row level security;

create table public.square_webhook_events (
  event_id text primary key,
  payment_id text,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  last_error text
);
alter table public.square_webhook_events enable row level security;
