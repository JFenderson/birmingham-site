// Shared sender address for all Resend transactional email. Override via
// EMAIL_FROM if the sending domain/address ever needs to change per
// environment; defaults to the verified Resend sending subdomain.
export const EMAIL_FROM = process.env.EMAIL_FROM ?? "notifications@mail.birminghamsigmas.org";
