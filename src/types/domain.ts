export type MemberRole =
  | "Member"
  | "Treasurer"
  | "Secretary"
  | "Intake Director"
  | "Admin";

export const MFA_REQUIRED_ROLES: readonly MemberRole[] = [
  "Admin",
  "Treasurer",
  "Intake Director",
];

export interface TenantContext {
  chapterId: string;
  chapterSlug: string;
}
