alter table public.initiative_submissions
  alter column duration_minutes drop not null;

alter table public.initiative_submissions
  drop constraint if exists initiative_submissions_duration_minutes_check;

alter table public.initiative_submissions
  add constraint initiative_submissions_duration_minutes_check
  check (duration_minutes is null or duration_minutes between 0 and 1440);
