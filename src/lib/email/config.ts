const DEFAULT_EMAIL_FROM = "notifications@mail.birminghamsigmas.org";
const DEFAULT_CHAPTER_FORM_EMAIL = "tausigmapbs@gmail.com";

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

// Shared sender address for all Resend transactional email. Override via
// EMAIL_FROM if the sending domain/address ever needs to change per
// environment; defaults to the verified Resend sending subdomain.
export function getEmailFrom() {
  return readEnv("EMAIL_FROM") ?? DEFAULT_EMAIL_FROM;
}

export function getResendApiKey() {
  return readEnv("RESEND_API_KEY");
}

/** Chapter receives every public program submission; the relevant program
 * recipient is included once, even when it is the same mailbox. */
export function getFormNotificationRecipients(programEmails?: string | string[] | null) {
  const emails = [
    readEnv("CHAPTER_FORM_EMAIL") ?? DEFAULT_CHAPTER_FORM_EMAIL,
    ...(Array.isArray(programEmails) ? programEmails : [programEmails]),
  ];
  const recipients: string[] = [];
  const seen = new Set<string>();
  for (const email of emails.flatMap((value) => (value ?? "").split(/[,;\n]/))) {
    const trimmed = email.trim();
    if (trimmed && !seen.has(trimmed.toLowerCase())) {
      recipients.push(trimmed);
      seen.add(trimmed.toLowerCase());
    }
  }
  return recipients;
}

export function getIntakeAdminEmail() {
  return readEnv("INTAKE_ADMIN_EMAIL");
}

export function getSigmaBetaAdminEmail() {
  return readEnv("SIGMA_BETA_ADMIN_EMAIL");
}

export function getFoundationAdminEmail() {
  return readEnv("FOUNDATION_ADMIN_EMAIL");
}

export function getEducationDirectorEmail() {
  return readEnv("EDUCATION_DIRECTOR_EMAIL");
}

export function getBbbDirectorEmail() {
  return readEnv("BBB_DIRECTOR_EMAIL");
}

export function getSocialActionDirectorEmail() {
  return readEnv("SOCIAL_ACTION_DIRECTOR_EMAIL");
}

export const EMAIL_FROM = getEmailFrom();
