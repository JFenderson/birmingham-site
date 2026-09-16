import assert from "node:assert/strict";
import test from "node:test";
import { emailSignInDependencies as deps, sendEmailSignInLink } from "../../src/lib/auth/email-sign-in";

test("email sign-in never creates accounts and limits sends before calling Auth", async (t) => {
  const original = { ...deps };
  t.after(() => { Object.assign(deps, original); });
  let blocked = false;
  let authError = false;
  let sent: unknown[] = [];
  const keys: string[] = [];
  deps.headers = async () => new Headers({ "x-forwarded-for": "203.0.113.8, 10.0.0.1", host: "evil.example" }) as Awaited<ReturnType<typeof deps.headers>>;
  deps.getTrustedSiteOrigin = () => "https://members.example.com";
  deps.checkRateLimit = async (key) => { keys.push(key); return { success: !blocked }; };
  deps.createClient = async () => ({
    auth: { signInWithOtp: async (input: unknown) => {
      sent.push(input);
      return { data: {}, error: authError ? { message: "Unknown account" } : null };
    } },
  }) as unknown as Awaited<ReturnType<typeof deps.createClient>>;

  const success = await sendEmailSignInLink(" Brother@Example.com ");
  assert.deepEqual(sent, [{ email: "brother@example.com", options: {
    shouldCreateUser: false, emailRedirectTo: "https://members.example.com/auth/sign-in",
  } }]);
  assert.equal(keys[0], "login-link:ip:203.0.113.8");
  assert.ok(keys[1]);
  assert.ok(keys[1].startsWith("login-link:email:"));
  assert.ok(!keys[1].includes("brother@example.com"));

  authError = true;
  assert.equal(await sendEmailSignInLink("unknown@example.com"), success);
  sent = [];
  blocked = true;
  assert.match(await sendEmailSignInLink("brother@example.com"), /wait/);
  assert.equal(sent.length, 0);
  blocked = false;
  for (const invalid of [null, 17, {}, "invalid", "a".repeat(255) + "@example.com"]) {
    assert.match(await sendEmailSignInLink(invalid), /valid email/);
  }
  assert.equal(sent.length, 0);
  deps.getTrustedSiteOrigin = () => null;
  assert.match(await sendEmailSignInLink("brother@example.com"), /temporarily unavailable/);
  assert.equal(sent.length, 0);
});
