-- Internal officer notes on a prospective member's pipeline record.
-- Append-only: no update/delete policy, mirroring audit_logs — a note is a
-- timestamped record of what an officer observed/decided, not a document
-- to be silently edited later.
create table public.prospective_member_notes (
  id uuid primary key default gen_random_uuid(),
  prospective_member_id uuid not null references public.prospective_members(id),
  chapter_id uuid not null references public.chapters(id),
  author_id uuid references public.profiles(id),
  note text not null,
  created_at timestamptz not null default now()
);

create index prospective_member_notes_pm_idx on public.prospective_member_notes (prospective_member_id, created_at);

alter table public.prospective_member_notes enable row level security;

create policy "prospective_member_notes_intake_read" on public.prospective_member_notes
  for select using (
    public.has_role(chapter_id, array['Intake Director','Admin']::public.member_role[])
  );

create policy "prospective_member_notes_intake_insert" on public.prospective_member_notes
  for insert with check (
    public.has_role(chapter_id, array['Intake Director','Admin']::public.member_role[])
  );

create trigger audit_prospective_member_notes
  after insert on public.prospective_member_notes
  for each row execute function public.audit_row_change();
