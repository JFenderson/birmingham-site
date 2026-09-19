-- The initial tracker import was run against the Miles chapter by mistake.
-- Move only that identified group-chat batch to the Birmingham root chapter.
do $$
declare
  source_chapter_id uuid;
  target_chapter_id uuid;
  moved_count integer;
begin
  select id into source_chapter_id from public.chapters where slug = 'miles';
  select id into target_chapter_id from public.chapters where slug = 'root';

  if source_chapter_id is null or target_chapter_id is null then
    raise notice 'Legacy initiative import was not moved because the required chapters do not exist.';
    return;
  end if;

  update public.initiative_submissions
  set chapter_id = target_chapter_id
  where chapter_id = source_chapter_id
    and submission_source = 'group_chat_import'
    and import_batch_id = 'e64fc693-f1f9-4bf5-aaa7-25f1229896b3';

  get diagnostics moved_count = row_count;
  raise notice 'Moved % legacy initiative import entries to the root chapter.', moved_count;
end;
$$;
