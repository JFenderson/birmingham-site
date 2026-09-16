export type MemberRole =
  | "Member"
  | "Treasurer"
  | "Secretary"
  | "Intake Director"
  | "Admin";

export interface TenantContext {
  chapterId: string;
  chapterSlug: string;
}
