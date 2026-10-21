-- Keep legacy text essays while new applications store the essay as a private file.
alter table public.scholarship_applications
  alter column essays drop not null,
  add column if not exists essay_file_path text;

-- Storage enforces the upload limit and MIME allowlist in addition to the
-- application checking each file's bytes before a submission is finalized.
update storage.buckets
set file_size_limit = 10 * 1024 * 1024,
    allowed_mime_types = array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ]
where id = 'scholarship-applications';
