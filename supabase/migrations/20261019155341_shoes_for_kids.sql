-- Shoes for Kids inventory is server-only. Public pages receive explicitly
-- projected anonymous fields from Next.js, never direct table access.
create table public.shoe_campaigns (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id),
  code text not null unique,
  name text not null,
  year integer not null check (year between 2020 and 2100),
  status text not null default 'draft' check (status in ('draft','published','paused','closed','archived')),
  timezone text not null default 'America/Chicago',
  physical_deadline timestamptz not null,
  reservation_days integer not null default 7 check (reservation_days between 1 and 30),
  distribution_note text not null default 'The week before Christmas',
  dropoff_location text,
  dropoff_hours text,
  dropoff_contact text,
  dropoff_instructions text,
  zeffy_url text,
  zeffy_embed_url text,
  show_donation_total boolean not null default true,
  suggested_pair_cents integer not null default 5000 check (suggested_pair_cents > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter_id, code)
);

create table public.shoe_requests (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.shoe_campaigns(id),
  external_ref text not null,
  public_ref text not null,
  school_code text not null,
  size_system text not null check (size_system in ('toddler','little-kid','youth','adult')),
  shoe_size text not null,
  width text not null check (width in ('standard','wide','extra-wide','narrow')),
  shoe_type text not null default 'Athletic sneakers',
  purchase_note text,
  status text not null default 'available' check (status in ('available','reserved','received','purchased','distributed','exception','cancelled')),
  reservation_id uuid,
  reserved_until timestamptz,
  received_at timestamptz,
  purchased_at timestamptz,
  distributed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, external_ref),
  unique (campaign_id, public_ref)
);

create table public.shoe_sponsors (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.shoe_campaigns(id),
  name text not null,
  email text not null,
  phone text,
  sponsor_type text not null check (sponsor_type in ('individual','organization')),
  organization_name text,
  recognition_consent boolean not null default false,
  transactional_consent boolean not null default false,
  created_at timestamptz not null default now()
);

create sequence public.shoe_reservation_reference_seq;
create table public.shoe_reservations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.shoe_campaigns(id),
  sponsor_id uuid not null references public.shoe_sponsors(id),
  reference text not null unique,
  management_token_hash text not null unique,
  management_token_expires_at timestamptz not null,
  status text not null default 'reserved' check (status in ('pending_confirmation','reserved','received','partially_received','cancelled','expired','exception','completed')),
  expires_at timestamptz not null,
  delivery_method text not null default 'dropoff' check (delivery_method in ('dropoff','coordinator')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.shoe_requests add constraint shoe_requests_reservation_fk foreign key (reservation_id) references public.shoe_reservations(id);

create table public.shoe_reservation_items (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.shoe_reservations(id),
  request_id uuid not null references public.shoe_requests(id),
  status text not null default 'reserved' check (status in ('reserved','received','exception','cancelled','expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reservation_id, request_id)
);

create table public.shoe_receipts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.shoe_campaigns(id),
  request_id uuid not null references public.shoe_requests(id),
  reservation_id uuid references public.shoe_reservations(id),
  condition text not null check (condition in ('accepted','exception')),
  size_verified boolean not null,
  width_verified boolean not null,
  type_verified boolean not null,
  note text,
  processed_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (request_id, condition) deferrable initially immediate
);

create table public.shoe_donations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.shoe_campaigns(id),
  zeffy_transaction_id text not null,
  amount_cents integer not null check (amount_cents >= 0),
  refunded_cents integer not null default 0 check (refunded_cents >= 0),
  currency text not null default 'USD',
  payment_status text not null check (payment_status in ('succeeded','pending','failed','refunded','partially_refunded','review')),
  donor_reference text,
  source text not null check (source in ('csv','manual','api')),
  review_note text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, zeffy_transaction_id),
  check (refunded_cents <= amount_cents)
);

create table public.shoe_allocations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.shoe_campaigns(id),
  donation_id uuid not null references public.shoe_donations(id),
  request_id uuid references public.shoe_requests(id),
  amount_cents integer not null check (amount_cents > 0),
  actual_purchase_cents integer check (actual_purchase_cents >= 0),
  created_at timestamptz not null default now()
);

create table public.shoe_purchases (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.shoe_campaigns(id),
  request_id uuid not null unique references public.shoe_requests(id),
  allocation_id uuid references public.shoe_allocations(id),
  cost_cents integer not null check (cost_cents > 0),
  note text,
  processed_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.shoe_distributions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.shoe_campaigns(id),
  request_id uuid not null unique references public.shoe_requests(id),
  school_code text not null,
  delivery_reference text not null,
  delivered_at timestamptz not null default now(),
  processed_by uuid not null references auth.users(id)
);

create table public.shoe_audit_logs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.shoe_campaigns(id),
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.shoe_staff_roles (
  chapter_id uuid not null references public.chapters(id),
  user_id uuid not null references auth.users(id),
  role text not null check (role in ('director','committee','finance','distribution')),
  granted_by uuid not null references auth.users(id),
  granted_at timestamptz not null default now(),
  primary key (chapter_id,user_id)
);

create index shoe_campaigns_chapter_idx on public.shoe_campaigns(chapter_id, year desc);
create index shoe_requests_available_idx on public.shoe_requests(campaign_id,size_system,shoe_size,width) where status = 'available';
create index shoe_requests_expired_idx on public.shoe_requests(campaign_id,reserved_until) where status = 'reserved';
create index shoe_reservations_expiry_idx on public.shoe_reservations(campaign_id,expires_at) where status in ('reserved','partially_received');
create index shoe_reservation_items_request_idx on public.shoe_reservation_items(request_id);
create index shoe_donations_campaign_idx on public.shoe_donations(campaign_id,created_at desc);
create index shoe_audit_campaign_idx on public.shoe_audit_logs(campaign_id,created_at desc);
create index shoe_distributions_school_idx on public.shoe_distributions(campaign_id,school_code,delivered_at);

do $$ declare tab text; begin
  foreach tab in array array['shoe_campaigns','shoe_requests','shoe_sponsors','shoe_reservations','shoe_reservation_items','shoe_receipts','shoe_donations','shoe_allocations','shoe_purchases','shoe_distributions','shoe_audit_logs','shoe_staff_roles'] loop
    execute format('alter table public.%I enable row level security', tab);
    execute format('revoke all on table public.%I from anon, authenticated', tab);
    execute format('grant select, insert, update, delete on table public.%I to service_role', tab);
  end loop;
end $$;
revoke all on sequence public.shoe_reservation_reference_seq from anon, authenticated;
grant usage, select on sequence public.shoe_reservation_reference_seq to service_role;

-- PostgreSQL function calls execute in one transaction. Row locks and a
-- unique request assignment prevent either adoption path from overbooking.
create function public.shoe_reserve(
  p_campaign_id uuid, p_sponsor jsonb, p_selections jsonb,
  p_token_hash text, p_delivery_method text
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  c public.shoe_campaigns%rowtype;
  r public.shoe_requests%rowtype;
  v_reservation_id uuid;
  v_sponsor_id uuid;
  v_reference text;
  v_expires timestamptz;
  selection jsonb;
  i integer;
  quantity integer;
  total integer := 0;
begin
  select * into c from public.shoe_campaigns where id = p_campaign_id for share;
  if not found or c.status <> 'published' or c.physical_deadline <= now() then
    raise exception 'CAMPAIGN_UNAVAILABLE';
  end if;
  if jsonb_typeof(p_selections) <> 'array' or jsonb_array_length(p_selections) < 1 or jsonb_array_length(p_selections) > 20 then
    raise exception 'INVALID_SELECTION';
  end if;
  if p_delivery_method not in ('dropoff','coordinator') or length(p_token_hash) <> 64 then
    raise exception 'INVALID_RESERVATION';
  end if;
  -- Add calendar days in the campaign's timezone, preserving local clock time
  -- across daylight-saving transitions before applying the hard deadline.
  v_expires := least(((now() at time zone c.timezone) + make_interval(days => c.reservation_days)) at time zone c.timezone,
    c.physical_deadline);
  -- Lazy expiry guarantees inventory becomes reusable even when cron is late.
  update public.shoe_reservation_items ri set status = 'expired', updated_at = now()
    from public.shoe_requests sr
    where ri.request_id = sr.id and sr.campaign_id = p_campaign_id
      and sr.status = 'reserved' and sr.reserved_until <= now() and ri.status = 'reserved';
  update public.shoe_requests set status = 'available', reservation_id = null, reserved_until = null, updated_at = now()
    where campaign_id = p_campaign_id and status = 'reserved' and reserved_until <= now();
  update public.shoe_reservations set status = 'expired', updated_at = now()
    where campaign_id = p_campaign_id and status = 'reserved' and expires_at <= now();
  insert into public.shoe_sponsors(campaign_id,name,email,phone,sponsor_type,organization_name,recognition_consent,transactional_consent)
    values(p_campaign_id,p_sponsor->>'name',p_sponsor->>'email',nullif(p_sponsor->>'phone',''),p_sponsor->>'sponsorType',nullif(p_sponsor->>'organizationName',''),coalesce((p_sponsor->>'recognitionConsent')::boolean,false),true)
    returning id into v_sponsor_id;
  v_reference := 'SFK-R-' || c.year || '-' || lpad(nextval('public.shoe_reservation_reference_seq')::text, 5, '0');
  insert into public.shoe_reservations(campaign_id,sponsor_id,reference,management_token_hash,management_token_expires_at,expires_at,delivery_method)
    values(p_campaign_id,v_sponsor_id,v_reference,p_token_hash,v_expires + interval '30 days',v_expires,p_delivery_method)
    returning id into v_reservation_id;
  for selection in select value from jsonb_array_elements(p_selections) loop
    quantity := coalesce((selection->>'quantity')::integer, 1);
    if quantity < 1 or quantity > 20 then raise exception 'INVALID_SELECTION'; end if;
    total := total + quantity;
    if total > 20 then raise exception 'INVALID_SELECTION'; end if;
    for i in 1..quantity loop
      if selection ? 'requestId' then
        select * into r from public.shoe_requests
          where id = (selection->>'requestId')::uuid and campaign_id = p_campaign_id and status = 'available'
          for update skip locked;
      else
        select * into r from public.shoe_requests
          where campaign_id = p_campaign_id and status = 'available'
            and size_system = selection->>'sizeSystem' and shoe_size = selection->>'shoeSize'
            and width = selection->>'width' and shoe_type = selection->>'shoeType'
          order by created_at, id limit 1 for update skip locked;
      end if;
      if not found then raise exception 'INVENTORY_CHANGED'; end if;
      update public.shoe_requests set status = 'reserved', reservation_id = v_reservation_id,
        reserved_until = v_expires, updated_at = now() where id = r.id;
      insert into public.shoe_reservation_items(reservation_id,request_id) values(v_reservation_id,r.id);
    end loop;
  end loop;
  insert into public.shoe_audit_logs(campaign_id,action,entity_type,entity_id,details)
    values(p_campaign_id,'reservation.created','reservation',v_reservation_id,jsonb_build_object('pairs',total));
  return jsonb_build_object('id',v_reservation_id,'reference',v_reference,'expiresAt',v_expires);
end $$;
revoke all on function public.shoe_reserve(uuid,jsonb,jsonb,text,text) from public, anon, authenticated;
grant execute on function public.shoe_reserve(uuid,jsonb,jsonb,text,text) to service_role;

create function public.shoe_expire_reservations() returns integer language plpgsql security invoker set search_path = '' as $$
declare n integer;
begin
  update public.shoe_reservation_items ri set status = 'expired', updated_at = now()
    from public.shoe_requests sr where ri.request_id = sr.id and sr.status = 'reserved'
    and sr.reserved_until <= now() and ri.status = 'reserved';
  update public.shoe_requests set status = 'available', reservation_id = null, reserved_until = null, updated_at = now()
    where status = 'reserved' and reserved_until <= now();
  get diagnostics n = row_count;
  update public.shoe_reservations set status = 'expired', updated_at = now()
    where status = 'reserved' and expires_at <= now();
  return n;
end $$;
revoke all on function public.shoe_expire_reservations() from public, anon, authenticated;
grant execute on function public.shoe_expire_reservations() to service_role;

create function public.shoe_cancel_reservation(p_id uuid, p_actor uuid) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare v public.shoe_reservations%rowtype;
begin
  select * into v from public.shoe_reservations where id = p_id for update;
  if not found or v.status in ('cancelled','expired','completed','received') then return false; end if;
  update public.shoe_reservation_items set status = 'cancelled', updated_at = now()
    where reservation_id = p_id and status = 'reserved';
  update public.shoe_requests set status = 'available', reservation_id = null, reserved_until = null, updated_at = now()
    where reservation_id = p_id and status = 'reserved';
  update public.shoe_reservations set status = 'cancelled', updated_at = now() where id = p_id;
  insert into public.shoe_audit_logs(campaign_id,actor_id,action,entity_type,entity_id)
    values(v.campaign_id,p_actor,'reservation.cancelled','reservation',p_id);
  return true;
end $$;
revoke all on function public.shoe_cancel_reservation(uuid,uuid) from public, anon, authenticated;
grant execute on function public.shoe_cancel_reservation(uuid,uuid) to service_role;

create function public.shoe_check_in(p_request_id uuid, p_actor uuid, p_accepted boolean,
  p_size_verified boolean, p_width_verified boolean, p_type_verified boolean, p_note text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare r public.shoe_requests%rowtype;
declare outstanding integer;
begin
  select * into r from public.shoe_requests where id = p_request_id for update;
  if not found or r.status <> 'reserved' or r.reservation_id is null then return false; end if;
  if p_accepted and not (p_size_verified and p_width_verified and p_type_verified) then return false; end if;
  insert into public.shoe_receipts(campaign_id,request_id,reservation_id,condition,size_verified,width_verified,type_verified,note,processed_by)
    values(r.campaign_id,r.id,r.reservation_id,case when p_accepted then 'accepted' else 'exception' end,
      p_size_verified,p_width_verified,p_type_verified,p_note,p_actor);
  update public.shoe_requests set status = case when p_accepted then 'received' else 'exception' end,
    received_at = case when p_accepted then now() else null end, updated_at = now() where id = r.id;
  update public.shoe_reservation_items set status = case when p_accepted then 'received' else 'exception' end,
    updated_at = now() where reservation_id = r.reservation_id and request_id = r.id and status = 'reserved';
  select count(*) into outstanding from public.shoe_reservation_items
    where reservation_id = r.reservation_id and status = 'reserved';
  update public.shoe_reservations set status = case
      when outstanding > 0 then 'partially_received'
      when exists(select 1 from public.shoe_reservation_items where reservation_id = r.reservation_id and status = 'exception') then 'exception'
      else 'received' end,
    updated_at = now() where id = r.reservation_id;
  insert into public.shoe_audit_logs(campaign_id,actor_id,action,entity_type,entity_id,details)
    values(r.campaign_id,p_actor,case when p_accepted then 'shoe.received' else 'shoe.exception' end,
      'request',r.id,jsonb_build_object('note',coalesce(p_note,'')));
  return true;
end $$;
revoke all on function public.shoe_check_in(uuid,uuid,boolean,boolean,boolean,boolean,text) from public, anon, authenticated;
grant execute on function public.shoe_check_in(uuid,uuid,boolean,boolean,boolean,boolean,text) to service_role;

create function public.shoe_import_requests(p_campaign_id uuid, p_actor uuid, p_rows jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare c public.shoe_campaigns%rowtype;
declare item jsonb;
declare existing public.shoe_requests%rowtype;
declare inserted integer := 0;
declare updated integer := 0;
declare skipped integer := 0;
begin
  select * into c from public.shoe_campaigns where id = p_campaign_id for update;
  if not found or c.status = 'archived' then raise exception 'CAMPAIGN_UNAVAILABLE'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) < 1 or jsonb_array_length(p_rows) > 500 then
    raise exception 'INVALID_IMPORT';
  end if;
  for item in select value from jsonb_array_elements(p_rows) loop
    select * into existing from public.shoe_requests
      where campaign_id = p_campaign_id and external_ref = item->>'externalRef' for update;
    if found then
      if existing.status <> 'available' then skipped := skipped + 1;
      else
        update public.shoe_requests set school_code = item->>'schoolCode', size_system = item->>'sizeSystem',
          shoe_size = item->>'shoeSize', width = item->>'width', shoe_type = item->>'shoeType',
          purchase_note = nullif(item->>'purchaseNote',''), updated_at = now() where id = existing.id;
        updated := updated + 1;
      end if;
    else
      insert into public.shoe_requests(campaign_id,external_ref,public_ref,school_code,size_system,shoe_size,width,shoe_type,purchase_note)
        values(p_campaign_id,item->>'externalRef',
          'SFK-' || c.year || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
          item->>'schoolCode',item->>'sizeSystem',item->>'shoeSize',item->>'width',item->>'shoeType',nullif(item->>'purchaseNote',''));
      inserted := inserted + 1;
    end if;
  end loop;
  insert into public.shoe_audit_logs(campaign_id,actor_id,action,entity_type,details)
    values(p_campaign_id,p_actor,'requests.imported','campaign',jsonb_build_object('inserted',inserted,'updated',updated,'skipped',skipped));
  return jsonb_build_object('inserted',inserted,'updated',updated,'skipped',skipped);
end $$;
revoke all on function public.shoe_import_requests(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.shoe_import_requests(uuid,uuid,jsonb) to service_role;

create function public.shoe_extend_reservation(p_id uuid, p_actor uuid, p_until timestamptz)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare r public.shoe_reservations%rowtype;
declare deadline timestamptz;
begin
  select * into r from public.shoe_reservations where id = p_id for update;
  if not found or r.status not in ('reserved','partially_received') then return false; end if;
  select physical_deadline into deadline from public.shoe_campaigns where id = r.campaign_id;
  if p_until <= now() or p_until > deadline then return false; end if;
  update public.shoe_reservations set expires_at = p_until,
    management_token_expires_at = greatest(management_token_expires_at,p_until + interval '30 days'),
    updated_at = now() where id = p_id;
  update public.shoe_requests set reserved_until = p_until, updated_at = now()
    where reservation_id = p_id and status = 'reserved';
  insert into public.shoe_audit_logs(campaign_id,actor_id,action,entity_type,entity_id,details)
    values(r.campaign_id,p_actor,'reservation.extended','reservation',p_id,jsonb_build_object('until',p_until));
  return true;
end $$;
revoke all on function public.shoe_extend_reservation(uuid,uuid,timestamptz) from public, anon, authenticated;
grant execute on function public.shoe_extend_reservation(uuid,uuid,timestamptz) to service_role;

create function public.shoe_import_donations(p_campaign_id uuid, p_actor uuid, p_rows jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare item jsonb;
begin
  if not exists(select 1 from public.shoe_campaigns where id = p_campaign_id) then raise exception 'CAMPAIGN_UNAVAILABLE'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) < 1 or jsonb_array_length(p_rows) > 500 then raise exception 'INVALID_IMPORT'; end if;
  for item in select value from jsonb_array_elements(p_rows) loop
    insert into public.shoe_donations(campaign_id,zeffy_transaction_id,amount_cents,refunded_cents,currency,payment_status,donor_reference,source,paid_at)
      values(p_campaign_id,item->>'transactionId',(item->>'amountCents')::integer,(item->>'refundedCents')::integer,
        coalesce(item->>'currency','USD'),item->>'status',nullif(item->>'donorReference',''),'csv',nullif(item->>'paidAt','')::timestamptz)
      on conflict (campaign_id,zeffy_transaction_id) do update set
        amount_cents = excluded.amount_cents, refunded_cents = excluded.refunded_cents,
        payment_status = excluded.payment_status, donor_reference = excluded.donor_reference,
        paid_at = excluded.paid_at, updated_at = now();
    update public.shoe_donations d set review_note = case
      when (select coalesce(sum(a.amount_cents),0) from public.shoe_allocations a where a.donation_id = d.id)
        > d.amount_cents - d.refunded_cents then 'Allocated funds exceed net donation after refund.'
      else null end
      where campaign_id = p_campaign_id and zeffy_transaction_id = item->>'transactionId';
  end loop;
  insert into public.shoe_audit_logs(campaign_id,actor_id,action,entity_type,details)
    values(p_campaign_id,p_actor,'donations.imported','campaign',jsonb_build_object('rows',jsonb_array_length(p_rows)));
  return jsonb_build_object('processed',jsonb_array_length(p_rows));
end $$;
revoke all on function public.shoe_import_donations(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.shoe_import_donations(uuid,uuid,jsonb) to service_role;

create function public.shoe_allocate_funds(p_campaign_id uuid, p_actor uuid, p_donation_id uuid,
  p_request_id uuid, p_amount_cents integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare d public.shoe_donations%rowtype;
declare allocated integer;
begin
  select * into d from public.shoe_donations where id = p_donation_id and campaign_id = p_campaign_id for update;
  if not found or d.payment_status not in ('succeeded','partially_refunded') or p_amount_cents <= 0 then return false; end if;
  if p_request_id is not null and not exists(select 1 from public.shoe_requests where id = p_request_id and campaign_id = p_campaign_id) then return false; end if;
  select coalesce(sum(amount_cents),0) into allocated from public.shoe_allocations where donation_id = p_donation_id;
  if allocated + p_amount_cents > d.amount_cents - d.refunded_cents then return false; end if;
  insert into public.shoe_allocations(campaign_id,donation_id,request_id,amount_cents)
    values(p_campaign_id,p_donation_id,p_request_id,p_amount_cents);
  insert into public.shoe_audit_logs(campaign_id,actor_id,action,entity_type,entity_id,details)
    values(p_campaign_id,p_actor,'donation.allocated','donation',p_donation_id,
      jsonb_build_object('requestId',p_request_id,'amountCents',p_amount_cents));
  return true;
end $$;
revoke all on function public.shoe_allocate_funds(uuid,uuid,uuid,uuid,integer) from public, anon, authenticated;
grant execute on function public.shoe_allocate_funds(uuid,uuid,uuid,uuid,integer) to service_role;

create function public.shoe_record_purchase(p_request_id uuid, p_actor uuid, p_cost_cents integer,
  p_allocation_id uuid, p_note text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare r public.shoe_requests%rowtype;
declare a public.shoe_allocations%rowtype;
begin
  select * into r from public.shoe_requests where id = p_request_id for update;
  if not found or r.status <> 'available' or p_cost_cents < 1 then return false; end if;
  if p_allocation_id is not null then
    select * into a from public.shoe_allocations where id = p_allocation_id for update;
    if not found or a.campaign_id <> r.campaign_id or a.request_id <> r.id or a.actual_purchase_cents is not null
      or p_cost_cents > a.amount_cents then return false; end if;
    update public.shoe_allocations set actual_purchase_cents = p_cost_cents where id = a.id;
  end if;
  insert into public.shoe_purchases(campaign_id,request_id,allocation_id,cost_cents,note,processed_by)
    values(r.campaign_id,r.id,p_allocation_id,p_cost_cents,p_note,p_actor);
  update public.shoe_requests set status = 'purchased', purchased_at = now(), updated_at = now() where id = r.id;
  insert into public.shoe_audit_logs(campaign_id,actor_id,action,entity_type,entity_id,details)
    values(r.campaign_id,p_actor,'shoe.purchased','request',r.id,jsonb_build_object('costCents',p_cost_cents));
  return true;
end $$;
revoke all on function public.shoe_record_purchase(uuid,uuid,integer,uuid,text) from public, anon, authenticated;
grant execute on function public.shoe_record_purchase(uuid,uuid,integer,uuid,text) to service_role;

create function public.shoe_distribute(p_request_id uuid, p_actor uuid, p_delivery_reference text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare r public.shoe_requests%rowtype;
begin
  select * into r from public.shoe_requests where id = p_request_id for update;
  if not found or r.status not in ('received','purchased') or length(trim(p_delivery_reference)) < 2 then return false; end if;
  insert into public.shoe_distributions(campaign_id,request_id,school_code,delivery_reference,processed_by)
    values(r.campaign_id,r.id,r.school_code,p_delivery_reference,p_actor);
  update public.shoe_requests set status = 'distributed', distributed_at = now(), updated_at = now() where id = r.id;
  if r.reservation_id is not null and not exists(
    select 1 from public.shoe_reservation_items ri join public.shoe_requests sr on sr.id = ri.request_id
    where ri.reservation_id = r.reservation_id and (ri.status <> 'received' or sr.status <> 'distributed')
  ) then
    update public.shoe_reservations set status = 'completed', updated_at = now() where id = r.reservation_id;
  end if;
  insert into public.shoe_audit_logs(campaign_id,actor_id,action,entity_type,entity_id,details)
    values(r.campaign_id,p_actor,'shoe.distributed','request',r.id,jsonb_build_object('deliveryReference',p_delivery_reference));
  return true;
end $$;
revoke all on function public.shoe_distribute(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.shoe_distribute(uuid,uuid,text) to service_role;

create function public.shoe_save_campaign(p_chapter_id uuid, p_actor uuid, p_id uuid, p_settings jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare result_id uuid;
begin
  if p_id is null then
    insert into public.shoe_campaigns(chapter_id,code,name,year,status,physical_deadline,reservation_days,distribution_note,
      dropoff_location,dropoff_hours,dropoff_contact,dropoff_instructions,zeffy_url,zeffy_embed_url,
      show_donation_total,suggested_pair_cents)
    values(p_chapter_id,p_settings->>'code',p_settings->>'name',(p_settings->>'year')::integer,
      p_settings->>'status',(p_settings->>'physicalDeadline')::timestamptz,(p_settings->>'reservationDays')::integer,
      p_settings->>'distributionNote',
      nullif(p_settings->>'dropoffLocation',''),nullif(p_settings->>'dropoffHours',''),nullif(p_settings->>'dropoffContact',''),
      nullif(p_settings->>'dropoffInstructions',''),nullif(p_settings->>'zeffyUrl',''),nullif(p_settings->>'zeffyEmbedUrl',''),
      (p_settings->>'showDonationTotal')::boolean,(p_settings->>'suggestedPairCents')::integer)
    returning id into result_id;
  else
    update public.shoe_campaigns set code = p_settings->>'code',name = p_settings->>'name',
      year = (p_settings->>'year')::integer,status = p_settings->>'status',
      physical_deadline = (p_settings->>'physicalDeadline')::timestamptz,
      reservation_days = (p_settings->>'reservationDays')::integer,
      distribution_note = p_settings->>'distributionNote',
      dropoff_location = nullif(p_settings->>'dropoffLocation',''),dropoff_hours = nullif(p_settings->>'dropoffHours',''),
      dropoff_contact = nullif(p_settings->>'dropoffContact',''),dropoff_instructions = nullif(p_settings->>'dropoffInstructions',''),
      zeffy_url = nullif(p_settings->>'zeffyUrl',''),zeffy_embed_url = nullif(p_settings->>'zeffyEmbedUrl',''),
      show_donation_total = (p_settings->>'showDonationTotal')::boolean,
      suggested_pair_cents = (p_settings->>'suggestedPairCents')::integer,updated_at = now()
    where id = p_id and chapter_id = p_chapter_id returning id into result_id;
    if result_id is null then raise exception 'CAMPAIGN_UNAVAILABLE'; end if;
    update public.shoe_reservations set expires_at = least(expires_at,(p_settings->>'physicalDeadline')::timestamptz),updated_at = now()
      where campaign_id = result_id and status in ('reserved','partially_received');
    update public.shoe_requests set reserved_until = least(reserved_until,(p_settings->>'physicalDeadline')::timestamptz),updated_at = now()
      where campaign_id = result_id and status = 'reserved';
  end if;
  insert into public.shoe_audit_logs(campaign_id,actor_id,action,entity_type,entity_id,details)
    values(result_id,p_actor,case when p_id is null then 'campaign.created' else 'campaign.updated' end,
      'campaign',result_id,jsonb_build_object('status',p_settings->>'status'));
  return result_id;
end $$;
revoke all on function public.shoe_save_campaign(uuid,uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.shoe_save_campaign(uuid,uuid,uuid,jsonb) to service_role;

create function public.shoe_assign_staff_role(p_chapter_id uuid, p_user_id uuid, p_role text, p_actor uuid)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare campaign_id uuid;
begin
  if p_role not in ('director','committee','finance','distribution') then return false; end if;
  if not exists(select 1 from public.profiles where id = p_user_id and membership_status = 'approved'
    and (chapter_id = p_chapter_id or role = 'super_admin')) then return false; end if;
  insert into public.shoe_staff_roles(chapter_id,user_id,role,granted_by)
    values(p_chapter_id,p_user_id,p_role,p_actor)
    on conflict (chapter_id,user_id) do update set role = excluded.role,granted_by = excluded.granted_by,granted_at = now();
  select id into campaign_id from public.shoe_campaigns where chapter_id = p_chapter_id
    order by year desc, created_at desc limit 1;
  if campaign_id is not null then
    insert into public.shoe_audit_logs(campaign_id,actor_id,action,entity_type,entity_id,details)
      values(campaign_id,p_actor,'staff.role_assigned','member',p_user_id,jsonb_build_object('role',p_role));
  end if;
  return true;
end $$;
revoke all on function public.shoe_assign_staff_role(uuid,uuid,text,uuid) from public, anon, authenticated;
grant execute on function public.shoe_assign_staff_role(uuid,uuid,text,uuid) to service_role;

insert into public.shoe_campaigns(chapter_id,code,name,year,physical_deadline)
select id,'sfk-2026','Shoes for Kids — Adopt a Pair',2026,'2026-12-12 05:59:59+00'::timestamptz
from public.chapters where slug = 'root' on conflict (code) do nothing;
