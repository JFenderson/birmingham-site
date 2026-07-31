create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id),
  profile_id uuid references public.profiles(id),
  type text not null check (type in ('dues','event_fee','donation','refund','other')),
  amount_cents bigint not null,
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('pending','completed','failed','refunded')),
  square_payment_id text,
  square_invoice_id text,
  description text,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_chapter_idx on public.transactions (chapter_id) where is_deleted = false;
create index transactions_profile_idx on public.transactions (profile_id);
create unique index transactions_square_payment_id_idx on public.transactions (square_payment_id) where square_payment_id is not null;

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

alter table public.transactions enable row level security;

create policy "transactions_self_read" on public.transactions
  for select using (profile_id = (select auth.uid()) and is_deleted = false);

create policy "transactions_treasurer_admin_read" on public.transactions
  for select using (
    public.has_role(chapter_id, array['Treasurer','Admin']::public.member_role[]) and is_deleted = false
  );

-- No insert policy for regular authenticated roles: writes are created by a
-- verified Square webhook handler (service-role) in a later phase.
create policy "transactions_treasurer_admin_update" on public.transactions
  for update using (
    public.has_role(chapter_id, array['Treasurer','Admin']::public.member_role[])
  ) with check (
    public.has_role(chapter_id, array['Treasurer','Admin']::public.member_role[])
  );
