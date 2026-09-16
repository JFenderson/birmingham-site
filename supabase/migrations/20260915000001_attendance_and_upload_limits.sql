alter table public.events
  add column if not exists check_in_code_hash text;

-- Keep provider-side limits in addition to application validation. The
-- application verifies the actual magic bytes before accepting a submission.
update storage.buckets
set file_size_limit = 8 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
where id = 'initiative-evidence';
update storage.buckets
set file_size_limit = 10 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'application/pdf']
where id = 'scholarship-applications';
update storage.buckets
set file_size_limit = 10 * 1024 * 1024,
    allowed_mime_types = array['application/pdf']
where id in ('bylaws', 'financials', 'minutes');
