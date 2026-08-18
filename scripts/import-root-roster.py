"""Import the sanitized Tau Sigma roster into Supabase.

The source workbook stays outside the repository. Only membership number,
member type, name, optional email, and active status are imported.
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import tempfile
from pathlib import Path

import openpyxl


def sql_text(value: object | None) -> str:
    if value is None or str(value).strip() == "":
        return "NULL"
    return "'" + str(value).strip().replace("'", "''") + "'"


def normalized_number(value: object) -> str:
    return re.sub(r"\s+", "", str(value).strip()).upper()


def normalized_last_name(value: object) -> str:
    return re.sub(r"\s+", " ", str(value).strip()).lower()


def build_sql(workbook_path: Path) -> str:
    sheet = openpyxl.load_workbook(workbook_path, read_only=True, data_only=True).active
    rows = list(sheet.iter_rows(values_only=True))[15:]
    records = [row for row in rows if row and row[1] is not None]
    values: list[str] = []

    for row in records:
        _, number, _, first, _, last, suffix, _, _, _, _, _, email = row[:13]
        last_name = str(last).strip()
        if suffix:
            last_name = f"{last_name} {str(suffix).strip()}"
        member_number = str(number).strip()
        values.append(
            "(" + ", ".join(
                [
                    "(select id from public.chapters where slug = 'root' and type = 'graduate')",
                    sql_text(member_number),
                    sql_text(normalized_number(number)),
                    sql_text(first),
                    "NULL",
                    sql_text(last_name),
                    sql_text(normalized_last_name(last_name)),
                    sql_text(email),
                    "'active'",
                ]
            ) + ")"
        )

    if not values:
        raise ValueError("No roster records found")

    return """begin;

insert into public.root_member_roster (
  chapter_id, membership_number, membership_number_normalized,
  first_name, middle_name, last_name, last_name_normalized,
  roster_email, status
)
values
""" + ",\n".join(values) + """
on conflict (membership_number_normalized) do update set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  last_name_normalized = excluded.last_name_normalized,
  roster_email = excluded.roster_email,
  status = excluded.status;

commit;
"""


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    sql = build_sql(args.workbook)

    if not args.apply:
        print(f"Prepared sanitized import for {sql.count('(select id from public.chapters') } rows.")
        return

    with tempfile.NamedTemporaryFile("w", suffix="-root-roster.sql", delete=False, encoding="utf-8") as handle:
        handle.write(sql)
        sql_path = Path(handle.name)

    try:
        supabase_cli = Path(__file__).resolve().parents[1] / "node_modules" / ".bin" / "supabase.cmd"
        command = [
            str(supabase_cli),
            "db",
            "query",
            "--linked",
            "--file",
            str(sql_path),
        ]
        subprocess.run(command, check=True)
    finally:
        sql_path.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
