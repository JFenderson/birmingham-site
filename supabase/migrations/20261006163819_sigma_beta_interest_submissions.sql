-- Year-round youth-program interest is separate from fraternity intake.
-- Only the server-side service role writes these records; no public Data API
-- access is granted to information about minors.
create table public.sigma_beta_interest_submissions (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete restrict,
  created_at timestamptz not null default now(),
  parent_name text not null check (char_length(btrim(parent_name)) between 1 and 200),
  parent_email text not null check (char_length(btrim(parent_email)) between 3 and 254),
  parent_phone text not null check (char_length(btrim(parent_phone)) between 7 and 20),
  student_name text not null check (char_length(btrim(student_name)) between 1 and 200),
  student_age smallint not null check (student_age between 8 and 18),
  grade_level smallint not null check (grade_level between 2 and 12),
  student_school text not null check (char_length(btrim(student_school)) between 1 and 200),
  referral_source text check (referral_source in (
    'chapter_website', 'social_media', 'current_member', 'sigma_member',
    'school', 'community_event', 'friend_family', 'other'
  )),
  questions text check (char_length(questions) <= 2000)
);

create index sigma_beta_interest_submissions_chapter_created_idx
  on public.sigma_beta_interest_submissions (chapter_id, created_at desc);

alter table public.sigma_beta_interest_submissions enable row level security;
revoke all on table public.sigma_beta_interest_submissions from anon, authenticated;
grant select, insert, update, delete on table public.sigma_beta_interest_submissions to service_role;
