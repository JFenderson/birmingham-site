alter table public.prospective_members
  drop constraint if exists prospective_members_form_type_check;

update public.prospective_members
set
  form_type = 'membership_interest',
  submitted_payload = jsonb_set(
    submitted_payload,
    '{formType}',
    '"membership_interest"'::jsonb,
    true
  )
where form_type = 'intake';

update public.prospective_members
set submitted_payload = jsonb_set(
  submitted_payload,
  '{formType}',
  '"membership_interest"'::jsonb,
  true
)
where submitted_payload->>'formType' = 'intake';

alter table public.prospective_members
  add constraint prospective_members_form_type_check
  check (form_type in ('membership_interest','reactivation','transfer'));
