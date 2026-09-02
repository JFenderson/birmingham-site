const DEFAULT_EMAIL_FROM = "notifications@mail.birminghamsigmas.org";

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
