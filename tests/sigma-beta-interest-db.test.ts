import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("Sigma Beta interest records persist privately and accept repeat interest", async (context) => {
  const db = new PGlite();
  context.after(() => db.close());
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create table public.chapters (id uuid primary key);
    insert into public.chapters values ('11111111-1111-4111-8111-111111111111');
  `);
  await db.exec(readFileSync("supabase/migrations/20261006163819_sigma_beta_interest_submissions.sql", "utf8"));

  const row = {
    chapter: "11111111-1111-4111-8111-111111111111",
    parent: "Jordan Miles",
    email: "jordan@example.com",
    phone: "(205) 555-0100",
    student: "Alex Miles",
    school: "Example Middle School",
  };
  await db.exec("grant usage on schema public to service_role, anon, authenticated; set role service_role;");
  for (let index = 0; index < 2; index += 1) {
    await db.query(
      `insert into public.sigma_beta_interest_submissions
       (chapter_id, parent_name, parent_email, parent_phone, student_name, student_age, grade_level, student_school)
       values ($1, $2, $3, $4, $5, 13, 8, $6)`,
      [row.chapter, row.parent, row.email, row.phone, row.student, row.school],
    );
  }
  const count = await db.query<{ count: number }>("select count(*)::int as count from public.sigma_beta_interest_submissions");
  assert.equal(count.rows[0]?.count, 2);

  await db.exec("reset role; set role anon;");
  await assert.rejects(() => db.query("select * from public.sigma_beta_interest_submissions"), /permission denied/);
  await db.exec("reset role; set role authenticated;");
  await assert.rejects(() => db.query("select * from public.sigma_beta_interest_submissions"), /permission denied/);
});
