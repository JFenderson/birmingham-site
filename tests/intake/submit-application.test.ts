import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getInterestFormTypeLabel,
  intakeFormSchema,
} from "../../src/lib/validation/schemas.ts";
import {
  getAdminInterestNotificationContent,
  getApplicantInterestNotificationContent,
} from "../../src/lib/email/intake-notification-content.ts";
import * as submitApplicationModule from "../../src/lib/intake/submit-application.ts";

const commonFields = {
  fullName: "Jordan Miles",
  email: "jmiles@example.com",
  phone: "205-555-0100",
  message: "Looking forward to learning more.",
};

test("intake form schema accepts membership interest submissions", () => {
  assert.equal(
    intakeFormSchema.safeParse({
      ...commonFields,
      formType: "membership_interest",
      schoolName: "UAB",
      major: "Engineering",
      expectedGraduationYear: "2028",
    }).success,
    true,
  );
});

test("intake form schema accepts transfer submissions", () => {
  assert.equal(
    intakeFormSchema.safeParse({
      ...commonFields,
      formType: "transfer",
      previousChapterName: "Beta Sigma",
    }).success,
    true,
  );
});

test("intake form schema accepts reactivation submissions", () => {
  assert.equal(
    intakeFormSchema.safeParse({
      ...commonFields,
      formType: "reactivation",
      previousChapterName: "Tau Sigma",
      yearsInactive: "4",
    }).success,
    true,
  );
});

test("intake form schema rejects the retired intake form type", () => {
  assert.equal(
    intakeFormSchema.safeParse({
      ...commonFields,
      formType: "intake",
      schoolName: "UAB",
    }).success,
    false,
  );
});

test("interest form labels expose a human-readable membership interest label", () => {
  assert.equal(
    getInterestFormTypeLabel("membership_interest"),
    "Membership Interest",
  );
});

test("interest notification content includes the human-readable form type for applicant and admin recipients", () => {
  const applicantContent = getApplicantInterestNotificationContent({
    applicantName: "Jordan Miles",
    chapterName: "Tau Sigma",
    formTypeLabel: "Membership Interest",
  });
  const adminContent = getAdminInterestNotificationContent({
    applicantName: "Jordan Miles",
    applicantEmail: "jmiles@example.com",
    chapterName: "Tau Sigma",
    formTypeLabel: "Membership Interest",
  });

  assert.equal(
    applicantContent.subject,
    "Membership Interest Submission Received",
  );
  assert.match(adminContent.subject, /Membership Interest/i);
  assert.match(adminContent.summary, /Membership Interest/i);
});

test("submitApplication persists the normalized form type and passes the readable label to notifications", async (context) => {
  assert.equal(
    typeof submitApplicationModule.submitApplicationDependencies,
    "object",
  );

  const inserts: Array<Record<string, unknown>> = [];
  const notificationCalls: Array<Record<string, unknown>> = [];

  context.mock.method(
    submitApplicationModule.submitApplicationDependencies,
    "createAdminClient",
    () =>
      ({
        from(table: string) {
          if (table === "prospective_members") {
            return {
              insert(payload: Record<string, unknown>) {
                inserts.push(payload);
                return Promise.resolve({ error: null });
              },
            };
          }

          if (table === "chapters") {
            return {
              select() {
                return {
                  eq() {
                    return {
                      maybeSingle() {
                        return Promise.resolve({ data: { name: "Tau Sigma" } });
                      },
                    };
                  },
                };
              },
            };
          }

          throw new Error(`Unexpected table: ${table}`);
        },
      }) as never,
  );

  context.mock.method(
    submitApplicationModule.submitApplicationDependencies,
    "sendInterestFormNotifications",
    (payload: Record<string, unknown>) => {
      notificationCalls.push(payload);
      return Promise.resolve({
        applicantError: null,
        adminError: null,
      });
    },
  );

  const result = await submitApplicationModule.submitApplication(
    "chapter-1",
    {
      ...commonFields,
      formType: "membership_interest",
      schoolName: "UAB",
      major: "Engineering",
      expectedGraduationYear: "2028",
    },
  );

  assert.equal(result.error, null);
  assert.equal(inserts.length, 1);
  assert.equal(inserts[0]?.form_type, "membership_interest");
  assert.equal(
    (inserts[0]?.submitted_payload as { formType?: string }).formType,
    "membership_interest",
  );
  assert.deepEqual(notificationCalls, [
    {
      to: "jmiles@example.com",
      applicantName: "Jordan Miles",
      applicantEmail: "jmiles@example.com",
      chapterName: "Tau Sigma",
      formTypeLabel: "Membership Interest",
    },
  ]);
});

test("submitApplication succeeds when notifications fail after a successful insert", async (context) => {
  const inserts: Array<Record<string, unknown>> = [];

  context.mock.method(
    submitApplicationModule.submitApplicationDependencies,
    "createAdminClient",
    () =>
      ({
        from(table: string) {
          if (table === "prospective_members") {
            return {
              insert(payload: Record<string, unknown>) {
                inserts.push(payload);
                return Promise.resolve({ error: null });
              },
            };
          }

          if (table === "chapters") {
            return {
              select() {
                return {
                  eq() {
                    return {
                      maybeSingle() {
                        return Promise.resolve({ data: { name: "Tau Sigma" } });
                      },
                    };
                  },
                };
              },
            };
          }

          throw new Error(`Unexpected table: ${table}`);
        },
      }) as never,
  );

  context.mock.method(
    submitApplicationModule.submitApplicationDependencies,
    "sendInterestFormNotifications",
    () => Promise.reject(new Error("Resend unavailable")),
  );
  context.mock.method(console, "error", () => undefined);

  const result = await submitApplicationModule.submitApplication(
    "chapter-1",
    {
      ...commonFields,
      formType: "transfer",
      previousChapterName: "Beta Sigma",
    },
  );

  assert.equal(result.error, null);
  assert.equal(inserts.length, 1);
  assert.equal(inserts[0]?.form_type, "transfer");
});

test("prospective members migration allows membership_interest and retires the old intake value", () => {
  const migration = readFileSync(
    new URL(
      "../../supabase/migrations/20260817000001_membership_interest_form_type.sql",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(migration, /drop constraint if exists prospective_members_form_type_check/i);
  assert.match(migration, /form_type = 'membership_interest'/i);
  assert.match(
    migration,
    /form_type in \('membership_interest','reactivation','transfer'\)/i,
  );
  assert.doesNotMatch(migration, /form_type in \('intake'/i);
});
