import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const chapter = "00000000-0000-4000-8000-000000000001";
const otherChapter = "00000000-0000-4000-8000-000000000002";
const admin = "00000000-0000-4000-8000-000000000011";
const member = "00000000-0000-4000-8000-000000000012";
const secretary = "00000000-0000-4000-8000-000000000013";
const suspended = "00000000-0000-4000-8000-000000000014";
const outsider = "00000000-0000-4000-8000-000000000015";

test("real PostgreSQL policies separate member sign-in from officer verification", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  // Model Supabase-managed auth/storage schemas. Execute the actual application
  // migrations, without the two optional extensions (unused by these policies).
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create schema storage;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.jwt() returns jsonb language sql stable as
      $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as
      $$ select (auth.jwt()->>'sub')::uuid $$;
    create function auth.role() returns text language sql stable as
      $$ select auth.jwt()->>'role' $$;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as
      $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1)-1] $$;
  `);
  for (const file of readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort()) {
    const sql = readFileSync(`supabase/migrations/${file}`, "utf8")
      .replace(/create extension if not exists "(?:pgcrypto|pg_trgm)";/g, "");
    await db.exec(sql);
  }
  await db.exec(`
    grant usage on schema public, auth, storage to anon, authenticated, service_role;
    grant all on all tables in schema public, storage to anon, authenticated, service_role;
    select set_config('request.jwt.claims', '{"role":"service_role"}', false);
    insert into public.chapters(id, slug, name, type) values
      ('${chapter}', 'root', 'Root', 'graduate'), ('${otherChapter}', 'other', 'Other', 'collegiate');
  `);
  for (const [id, role, access, status, chapterId] of [
    [admin, "Admin", "chapter_admin", "approved", chapter],
    [member, "Member", "member", "approved", chapter],
    [secretary, "Secretary", "member", "approved", chapter],
    [suspended, "Admin", "member", "suspended", chapter],
    [outsider, "Member", "member", "approved", otherChapter],
  ]) {
    await db.query("insert into auth.users(id) values ($1)", [id]);
    await db.query("update public.profiles set chapter_id=$2, membership_status=$3, role=$4, approved_at=now() where id=$1", [id, chapterId, status, access]);
    await db.query("insert into public.chapter_members(chapter_id,profile_id,role) values ($1,$2,$3)", [chapterId, id, role]);
  }
  await db.exec(`
    insert into public.events(chapter_id,title,starts_at) values ('${chapter}', 'Member event', now());
    insert into public.prospective_members(chapter_id,full_name,email,form_type,submitted_payload)
      values ('${chapter}','Applicant','applicant@example.com','membership_interest','{}');
    insert into public.transactions(chapter_id,profile_id,type,amount_cents)
      values ('${chapter}','${admin}','dues',100), ('${chapter}','${member}','dues',200);
    insert into public.documents(chapter_id,category,title,storage_bucket,storage_path,visible_to_roles) values
      ('${chapter}','minutes','General minutes','minutes','${chapter}/general.pdf',array['Member','Admin','Secretary']::public.member_role[]),
      ('${chapter}','minutes','Officer minutes','minutes','${chapter}/officer.pdf',array['Admin','Secretary']::public.member_role[]),
      ('${chapter}','financials','Financials','financials','${chapter}/finance.pdf',array['Admin','Treasurer']::public.member_role[]);
    insert into storage.objects(bucket_id,name) values
      ('minutes','${chapter}/general.pdf'), ('minutes','${chapter}/officer.pdf'), ('financials','${chapter}/finance.pdf');
  `);
  async function signIn(id: string, aal: "aal1" | "aal2") {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({ sub: id, role: "authenticated", aal })]);
    await db.exec("set role authenticated");
  }
  async function count(table: string) {
    const result = await db.query<{ n: number }>(`select count(*)::int as n from ${table}`);
    assert.ok(result.rows[0]);
    return result.rows[0].n;
  }
  await t.test("members read chapter content without MFA but cannot use officer writes", async () => {
    await signIn(member, "aal1");
    assert.equal(await count("public.events"), 1);
    assert.equal(await count("public.documents"), 1);
    assert.equal(await count("storage.objects"), 1);
    assert.equal(await count("public.prospective_members"), 0);
    await assert.rejects(db.query("insert into public.events(chapter_id,title,starts_at) values ($1,'Denied',now())", [chapter]));
  });
  await t.test("AAL1 admin reads only general documents and personal payments", async () => {
    await signIn(admin, "aal1");
    assert.equal(await count("public.events"), 1);
    assert.equal(await count("public.documents"), 1);
    assert.equal(await count("storage.objects"), 1);
    assert.equal(await count("public.transactions"), 1);
    assert.equal(await count("public.prospective_members"), 0);
    await assert.rejects(db.query("insert into public.events(chapter_id,title,starts_at) values ($1,'Denied',now())", [chapter]));
    await assert.rejects(db.query("update public.profiles set membership_status='suspended' where id=$1", [admin]));
    const updated = await db.query("update public.profiles set role='chapter_admin' where id=$1 returning id", [member]);
    assert.equal(updated.rows.length, 0);
  });
  await t.test("AAL2 admin can use officer tools", async () => {
    await signIn(admin, "aal2");
    assert.equal(await count("public.documents"), 3);
    assert.equal(await count("storage.objects"), 3);
    assert.equal(await count("public.transactions"), 2);
    assert.equal(await count("public.prospective_members"), 1);
    await db.query("insert into public.events(chapter_id,title,starts_at) values ($1,'Allowed',now())", [chapter]);
    await db.query("update public.profiles set phone='123' where id=$1", [member]);
  });
  await t.test("Secretary needs MFA and cannot promote themselves even after verification", async () => {
    await signIn(secretary, "aal1");
    await assert.rejects(db.query("insert into public.events(chapter_id,title,starts_at) values ($1,'Denied',now())", [chapter]));
    await signIn(secretary, "aal2");
    await db.query("insert into public.events(chapter_id,title,starts_at) values ($1,'Secretary event',now())", [chapter]);
    await assert.rejects(db.query("update public.chapter_members set role='Admin' where profile_id=$1", [secretary]));
    assert.equal(await count("public.transactions"), 0);
  });
  await t.test("suspended legacy officer and another chapter remain isolated", async () => {
    for (const id of [suspended, outsider]) {
      await signIn(id, "aal2");
      assert.equal(await count("public.events"), 0);
      assert.equal(await count("public.documents"), 0);
      assert.equal(await count("storage.objects"), 0);
      assert.equal(await count("public.prospective_members"), 0);
    }
  });
  await t.test("anonymous callers cannot read protected member data", async () => {
    await db.exec("reset role; select set_config('request.jwt.claims','{\"role\":\"anon\"}',false); set role anon;");
    for (const table of ["public.events", "public.documents", "storage.objects", "public.prospective_members", "public.audit_logs"]) {
      assert.equal(await count(table), 0);
    }
  });
});
