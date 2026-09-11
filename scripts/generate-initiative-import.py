"""Generate reviewed SQL for importing a steps workbook into Supabase.

Usage: python generate-initiative-import.py C:\\path\\steps.xlsx > import.sql
"""
import sys, uuid
from datetime import datetime
import openpyxl

RATE = 2100
batch = str(uuid.uuid4())
book = openpyxl.load_workbook(sys.argv[1], data_only=True)
sheet = book.active
headers = [cell.value for cell in sheet[1]]
rows = [dict(zip(headers, [cell.value for cell in row])) for row in sheet.iter_rows(min_row=2) if any(cell.value is not None for cell in row)]

def sql(value):
    if value is None: return "null"
    if isinstance(value, datetime): return "'" + value.date().isoformat() + "'"
    if isinstance(value, str): return "'" + value.replace("'", "''") + "'"
    return str(value)

print("begin;")
print("-- Review the generated rows before executing this file.")
for row in rows:
    steps = row.get("Steps")
    miles = row.get("Miles")
    estimated = steps is None and miles is not None
    if estimated: steps = round(float(miles) * RATE)
    hours = row.get("Hour") or 0
    minutes = row.get("Min") or 0
    duration = int(hours * 60 + minutes) or None
    print("insert into public.initiative_submissions (chapter_id, initiative, first_name, last_name, steps, distance_miles, tracked_on, duration_minutes, submission_source, steps_source, steps_per_mile_used, import_batch_id) select id, 'steps', {0}, {1}, {2}, {3}, {4}, {5}, 'group_chat_import', {6}, {7}, '{8}' from public.chapters where slug = 'miles' and not exists (select 1 from public.initiative_submissions s where s.chapter_id = public.chapters.id and s.initiative = 'steps' and lower(s.first_name) = lower({0}) and lower(s.last_name) = lower({1}) and s.tracked_on = {4} and s.is_deleted = false);".format(sql(str(row['Name']).split(' ', 1)[0]), sql(str(row['Name']).split(' ', 1)[1]), sql(int(steps)), sql(miles), sql(row['Date']), sql(duration), sql('estimated' if estimated else 'submitted'), sql(RATE if estimated else None), batch))
print("commit;")
