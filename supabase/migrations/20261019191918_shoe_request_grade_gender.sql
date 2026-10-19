alter table public.shoe_requests
  add column grade_level text check (grade_level in
    ('Pre-K','Kindergarten','1st Grade','2nd Grade','3rd Grade','4th Grade','5th Grade')),
  add column gender text check (gender in ('Boy','Girl','Not specified'));

create or replace function public.shoe_import_requests(p_campaign_id uuid, p_actor uuid, p_rows jsonb)
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
        update public.shoe_requests set school_code = item->>'schoolCode',
          grade_level = case when item ? 'gradeLevel' then nullif(item->>'gradeLevel','') else existing.grade_level end,
          gender = case when item ? 'gender' then nullif(item->>'gender','') else existing.gender end,
          size_system = item->>'sizeSystem', shoe_size = item->>'shoeSize',
          width = item->>'width', shoe_type = item->>'shoeType',
          purchase_note = nullif(item->>'purchaseNote',''), updated_at = now()
          where id = existing.id;
        updated := updated + 1;
      end if;
    else
      insert into public.shoe_requests
        (campaign_id,external_ref,public_ref,school_code,grade_level,gender,size_system,shoe_size,width,shoe_type,purchase_note)
        values(p_campaign_id,item->>'externalRef',
          'SFK-' || c.year || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
          item->>'schoolCode',nullif(item->>'gradeLevel',''),nullif(item->>'gender',''),
          item->>'sizeSystem',item->>'shoeSize',item->>'width',item->>'shoeType',
          nullif(item->>'purchaseNote',''));
      inserted := inserted + 1;
    end if;
  end loop;
  insert into public.shoe_audit_logs(campaign_id,actor_id,action,entity_type,details)
    values(p_campaign_id,p_actor,'requests.imported','campaign',jsonb_build_object('inserted',inserted,'updated',updated,'skipped',skipped));
  return jsonb_build_object('inserted',inserted,'updated',updated,'skipped',skipped);
end $$;
revoke all on function public.shoe_import_requests(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.shoe_import_requests(uuid,uuid,jsonb) to service_role;
