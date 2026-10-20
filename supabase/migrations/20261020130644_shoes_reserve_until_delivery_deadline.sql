-- Give the 2026 campaign a single deadline for reservations and delivery.
-- The reserve function already caps the hold at physical_deadline.
alter table public.shoe_campaigns
  drop constraint shoe_campaigns_reservation_days_check;
alter table public.shoe_campaigns
  add constraint shoe_campaigns_reservation_days_check
  check (reservation_days between 1 and 365);

update public.shoe_campaigns
set physical_deadline = '2026-12-06 05:59:59+00'::timestamptz,
    reservation_days = 365,
    updated_at = now()
where code = 'sfk-2026' and year = 2026;

-- Preserve any outstanding pledges made under the earlier seven-day hold.
update public.shoe_reservations r
set expires_at = c.physical_deadline,
    management_token_expires_at = greatest(r.management_token_expires_at, c.physical_deadline + interval '30 days'),
    updated_at = now()
from public.shoe_campaigns c
where r.campaign_id = c.id and c.code = 'sfk-2026' and c.year = 2026
  and r.status in ('reserved', 'partially_received');

update public.shoe_requests q
set reserved_until = c.physical_deadline, updated_at = now()
from public.shoe_campaigns c
where q.campaign_id = c.id and c.code = 'sfk-2026' and c.year = 2026
  and q.status = 'reserved';
