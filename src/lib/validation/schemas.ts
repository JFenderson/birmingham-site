import { z } from "zod";

/**
 * Shared client/server validation schemas. Every Server Action re-validates
 * against these (zero-trust — RLS is the last line of defense, not the
 * only one), so schemas live here rather than duplicated per form.
 */

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof loginSchema>;

const plainPublicText = z
  .string()
  .trim()
  .refine((value) => !/[<>]/.test(value), {
    message: "Please remove angle brackets from this field.",
  });

export const requestAccessSchema = z.object({
  membershipNumber: plainPublicText.min(1).max(64),
  lastName: plainPublicText.min(1).max(120),
  fullName: plainPublicText.min(1).max(200),
  email: z.string().trim().email().max(254).toLowerCase(),
});
export type RequestAccessInput = z.infer<typeof requestAccessSchema>;

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal("")),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

const intakeCommonFields = {
  fullName: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
};

export const interestFormTypeSchema = z.enum([
  "membership_interest",
  "transfer",
  "reactivation",
]);
export type InterestFormType = z.infer<typeof interestFormTypeSchema>;

export const INTEREST_FORM_TYPE_LABELS: Record<InterestFormType, string> = {
  membership_interest: "Membership Interest",
  transfer: "Transfer",
  reactivation: "Reactivation",
};

export function getInterestFormTypeLabel(formType: InterestFormType): string {
  return INTEREST_FORM_TYPE_LABELS[formType];
}

/**
 * Public intake/reactivation/transfer submission. Server-side, this is the
 * only validation an applicant's payload receives before insert — RLS grants
 * no anon insert policy on prospective_members, so the Server Action (using
 * the service-role client) is the sole enforcement point.
 */
export const intakeFormSchema = z.discriminatedUnion("formType", [
  z.object({
    formType: z.literal("membership_interest"),
    ...intakeCommonFields,
    schoolName: z.string().trim().min(1).max(200),
    major: z.string().trim().max(200).optional().or(z.literal("")),
    expectedGraduationYear: z.string().trim().max(9).optional().or(z.literal("")),
  }),
  z.object({
    formType: z.literal("reactivation"),
    ...intakeCommonFields,
    previousChapterName: z.string().trim().min(1).max(200),
    yearsInactive: z.string().trim().max(50).optional().or(z.literal("")),
  }),
  z.object({
    formType: z.literal("transfer"),
    ...intakeCommonFields,
    previousChapterName: z.string().trim().min(1).max(200),
  }),
]);
export type IntakeFormInput = z.infer<typeof intakeFormSchema>;

export const intakeStageSchema = z.object({
  pipelineStage: z.enum([
    "submitted",
    "under_review",
    "interview",
    "approved",
    "denied",
    "reactivation",
    "transfer",
  ]),
});

export const intakeNoteSchema = z.object({
  note: z.string().trim().min(1).max(2000),
});

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    startsAt: z.string().trim().min(1),
    locationName: z.string().trim().max(200).optional().or(z.literal("")),
    geofenceLat: z.coerce.number().min(-90).max(90).optional(),
    geofenceLng: z.coerce.number().min(-180).max(180).optional(),
    geofenceRadiusM: z.coerce.number().int().min(10).max(5000).optional(),
  })
  .refine(
    (data) =>
      (data.geofenceLat === undefined &&
        data.geofenceLng === undefined &&
        data.geofenceRadiusM === undefined) ||
      (data.geofenceLat !== undefined &&
        data.geofenceLng !== undefined &&
        data.geofenceRadiusM !== undefined),
    { message: "Geofence latitude, longitude, and radius must all be set together." }
  );
export type EventFormInput = z.infer<typeof eventFormSchema>;

export const checkInSchema = z.object({
  eventId: z.string().uuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type CheckInInput = z.infer<typeof checkInSchema>;

export const documentUploadSchema = z.object({
  category: z.enum(["bylaws", "financials", "minutes"]),
  title: z.string().trim().min(1).max(200),
  storagePath: z.string().trim().min(1),
});
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;

export const paymentIntentSchema = z.object({
  sourceId: z.string().trim().min(1), // tokenized card nonce from Web Payments SDK
  amountCents: z.coerce.number().int().min(100).max(1_000_000),
  type: z.enum(["dues", "event_fee", "donation"]),
  description: z.string().trim().max(200).optional().or(z.literal("")),
});
export type PaymentIntentInput = z.infer<typeof paymentIntentSchema>;

export const inviteMemberSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  membershipNumber: plainPublicText.max(64).optional().or(z.literal("")),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const memberIdSchema = z.string().uuid();

export const membershipStatusSchema = z.enum([
  "pending",
  "approved",
  "suspended",
]);
export type MembershipStatusInput = z.infer<typeof membershipStatusSchema>;

export const memberRoleSchema = z.enum([
  "member",
  "chapter_admin",
  "super_admin",
]);
export type MemberRoleInput = z.infer<typeof memberRoleSchema>;

export const memberStatusUpdateSchema = z.object({
  memberId: memberIdSchema,
  status: membershipStatusSchema,
});

export const memberRoleAssignmentSchema = z.object({
  memberId: memberIdSchema,
  role: memberRoleSchema,
});

/**
 * Public Sigma Beta Club interest form. `website` is an inline honeypot
 * field: real visitors never populate it (it is visually hidden), so any
 * non-empty value fails validation and the Server Action treats it as a bot
 * submission before doing any work.
 */
export const sigmaBetaInterestRoleSchema = z.enum([
  "student",
  "parent_guardian",
  "other",
]);
export type SigmaBetaInterestRole = z.infer<typeof sigmaBetaInterestRoleSchema>;

export const sigmaBetaInterestSchema = z.object({
  name: plainPublicText.min(1).max(200),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  role: sigmaBetaInterestRoleSchema,
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")),
});
export type SigmaBetaInterestInput = z.infer<typeof sigmaBetaInterestSchema>;
