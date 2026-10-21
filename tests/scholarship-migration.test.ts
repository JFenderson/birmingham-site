import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("essay file migration preserves old essays and restricts scholarship uploads", async () => {
  const database = new PGlite();
  try {
    await database.exec(`
      create schema storage;
      create table public.scholarship_applications (id integer primary key, essays text not null);
      insert into public.scholarship_applications values (1, 'Legacy essay text');
      create table storage.buckets (
        id text primary key, file_size_limit bigint, allowed_mime_types text[]
      );
      insert into storage.buckets (id) values ('scholarship-applications');
    `);
    const migration = readFileSync("supabase/migrations/20261021170344_scholarship_essay_upload.sql", "utf8");
    await database.exec(migration);

    const { rows: applications } = await database.query<{ essays: string | null; essay_file_path: string | null }>(
      "select essays, essay_file_path from public.scholarship_applications where id = 1",
    );
    assert.deepEqual(applications, [{ essays: "Legacy essay text", essay_file_path: null }]);
    await database.exec("insert into public.scholarship_applications (id, essays, essay_file_path) values (2, null, 'private/essay.docx')");
    const { rows: buckets } = await database.query<{ file_size_limit: number; allowed_mime_types: string[] }>(
      "select file_size_limit, allowed_mime_types from storage.buckets where id = 'scholarship-applications'",
    );
    assert.equal(buckets[0]?.file_size_limit, 10 * 1024 * 1024);
    assert.ok(buckets[0]?.allowed_mime_types.includes("application/pdf"));
    assert.ok(buckets[0]?.allowed_mime_types.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
  } finally {
    await database.close();
  }
});
