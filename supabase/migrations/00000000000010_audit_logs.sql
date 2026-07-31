create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references public.chapters(id),
  user_id uuid references public.profiles(id),
  action text not null,
  target_table text not null,
  target_id uuid,
  ip_address inet,
  -- PII-scrubbed context only. Never store raw submitted_payload/PII here.
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_chapter_idx on public.audit_logs (chapter_id);
create index audit_logs_target_idx on public.audit_logs (target_table, target_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;

-- Immutable: no update/delete policy anywhere, ever.
create policy "audit_logs_admin_read" on public.audit_logs
  for select using (
    chapter_id is null or public.has_role(chapter_id, array['Admin']::public.member_role[])
  );

-- Inserts happen exclusively via this security-definer function — no direct
-- insert policy for authenticated/anon roles.
create or replace function public.log_audit_event(
  p_chapter_id uuid,
  p_user_id uuid,
  p_action text,
  p_target_table text,
  p_target_id uuid,
  p_ip inet default null,
  p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (chapter_id, user_id, action, target_table, target_id, ip_address, metadata)
  values (p_chapter_id, p_user_id, p_action, p_target_table, p_target_id, p_ip, p_metadata);
end;
$$;

-- Generic trigger: baseline coverage for sensitive-table writes. IP address
-- is not available inside a DB trigger, so security-critical actions that
-- need it (login, role changes, refunds) must ALSO call log_audit_event()
-- directly from the Server Action with headers().get('x-forwarded-for').
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chapter_id uuid;
  v_target_id uuid;
begin
  v_target_id := coalesce(new.id, old.id);
  v_chapter_id := coalesce(new.chapter_id, old.chapter_id);
  perform public.log_audit_event(
    v_chapter_id,
    (select auth.uid()),
    TG_TABLE_NAME || '.' || lower(TG_OP),
    TG_TABLE_NAME,
    v_target_id,
    null,
    '{}'::jsonb
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_chapter_members
  after insert or update or delete on public.chapter_members
  for each row execute function public.audit_row_change();

create trigger audit_events
  after insert or update or delete on public.events
  for each row execute function public.audit_row_change();

create trigger audit_transactions
  after insert or update or delete on public.transactions
  for each row execute function public.audit_row_change();

create trigger audit_documents
  after insert or update or delete on public.documents
  for each row execute function public.audit_row_change();

create trigger audit_prospective_members
  after insert or update or delete on public.prospective_members
  for each row execute function public.audit_row_change();

-- Not attached to `profiles`: self-service profile edits would otherwise
-- generate noisy audit spam. Capture profile PII changes at the
-- application layer only if/when that becomes a real requirement.
