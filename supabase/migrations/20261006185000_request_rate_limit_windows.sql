-- Server-only rate limiting fallback for environments with a read-only Redis token.
-- Hashed keys avoid storing visitor IP addresses in the counter table.
create table public.request_rate_limit_windows (
  key_hash text not null check (key_hash ~ '^[0-9a-f]{64}$'),
  window_bucket bigint not null,
  attempts integer not null check (attempts > 0),
  expires_at timestamptz not null,
  primary key (key_hash, window_bucket)
);

create index request_rate_limit_windows_expiry_idx
  on public.request_rate_limit_windows (expires_at);

alter table public.request_rate_limit_windows enable row level security;
revoke all on public.request_rate_limit_windows from anon, authenticated;
grant select, insert, update, delete on public.request_rate_limit_windows to service_role;

create function public.check_request_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_ms bigint
) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_bucket bigint;
  current_attempts integer;
begin
  if p_key_hash !~ '^[0-9a-f]{64}$' or p_limit < 1 or p_window_ms < 1 then
    raise exception 'Invalid rate-limit parameters';
  end if;

  -- The index keeps this cleanup cheap for the low-volume public forms.
  delete from public.request_rate_limit_windows
  where expires_at < clock_timestamp();

  current_bucket := floor(
    extract(epoch from clock_timestamp()) * 1000 / p_window_ms
  )::bigint;

  insert into public.request_rate_limit_windows
    (key_hash, window_bucket, attempts, expires_at)
  values
    (p_key_hash, current_bucket, 1,
     clock_timestamp() + (p_window_ms * 2) * interval '1 millisecond')
  on conflict (key_hash, window_bucket)
  do update set attempts = public.request_rate_limit_windows.attempts + 1
  returning attempts into current_attempts;

  return current_attempts <= p_limit;
end;
$$;

revoke all on function public.check_request_rate_limit(text, integer, bigint)
  from public, anon, authenticated;
grant execute on function public.check_request_rate_limit(text, integer, bigint)
  to service_role;
