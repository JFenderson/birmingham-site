alter table public.initiative_submissions
  alter column evidence_path drop not null,
  alter column evidence_content_type drop not null,
  alter column evidence_size_bytes drop not null,
  alter column cleanup_token_hash drop not null;

alter table public.initiative_submissions
  add column if not exists submission_source text not null default 'public_submission'
    check (submission_source in ('public_submission', 'group_chat_import')),
  add column if not exists steps_source text not null default 'submitted'
    check (steps_source in ('submitted', 'estimated')),
  add column if not exists steps_per_mile_used numeric(8,2),
  add column if not exists import_batch_id uuid;

alter table public.initiative_submissions
  drop constraint if exists initiative_submissions_evidence_required,
  add constraint initiative_submissions_evidence_required check (
    submission_source = 'group_chat_import'
    or (evidence_path is not null and evidence_content_type is not null and evidence_size_bytes is not null)
  );
