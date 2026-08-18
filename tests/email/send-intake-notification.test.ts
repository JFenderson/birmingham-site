import assert from "node:assert/strict";
import test from "node:test";

import * as intakeNotificationModule from "../../src/lib/email/send-intake-notification.ts";

test("sendInterestFormNotifications attempts applicant and admin delivery even when the applicant receipt fails", async (context) => {
  assert.equal(
    typeof intakeNotificationModule.interestFormNotificationDependencies,
    "object",
  );

  const sendCalls: Array<Record<string, unknown>> = [];

  context.mock.method(
    intakeNotificationModule.interestFormNotificationDependencies,
    "createResendClient",
    () =>
      ({
        emails: {
          send(payload: Record<string, unknown>) {
            sendCalls.push(payload);

            if (sendCalls.length === 1) {
              return Promise.reject(new Error("Applicant receipt failed"));
            }

            return Promise.resolve({ data: { id: "email_123" }, error: null });
          },
        },
      }) as never,
  );
  context.mock.method(
    intakeNotificationModule.interestFormNotificationDependencies,
    "getAdminRecipient",
    () => "admin@birminghamsigmas.org",
  );
  context.mock.method(
    intakeNotificationModule.interestFormNotificationDependencies,
    "loadApplicantTemplate",
    () =>
      Promise.resolve({
        IntakeReceivedEmail: ({ applicantName }: { applicantName: string }) =>
          applicantName,
      }),
  );
  context.mock.method(
    intakeNotificationModule.interestFormNotificationDependencies,
    "loadAdminTemplate",
    () =>
      Promise.resolve({
        IntakeAdminNotificationEmail: ({
          applicantEmail,
        }: {
          applicantEmail: string;
        }) => applicantEmail,
      }),
  );

  const result = await intakeNotificationModule.sendInterestFormNotifications({
    to: "jmiles@example.com",
    applicantName: "Jordan Miles",
    applicantEmail: "jmiles@example.com",
    chapterName: "Tau Sigma",
    formTypeLabel: "Membership Interest",
  });

  assert.equal(sendCalls.length, 2);
  assert.equal(result.applicantError?.message, "Applicant receipt failed");
  assert.equal(result.adminError, null);
  assert.equal(sendCalls[0]?.to, "jmiles@example.com");
  assert.equal(sendCalls[1]?.to, "admin@birminghamsigmas.org");
  assert.equal(typeof sendCalls[0]?.text, "string");
  assert.equal(typeof sendCalls[1]?.text, "string");
});
