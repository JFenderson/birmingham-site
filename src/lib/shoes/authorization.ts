import "server-only";
import { AuthorizationError, requireApprovedMember } from "@/lib/auth/authorization";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { createAdminClient } from "@/lib/supabase/admin";

export type ShoeStaffRole = "super" | "director" | "committee" | "finance" | "distribution";

export async function requireShoeStaff() {
  const member = await requireApprovedMember();
  const tenant = await getTenantContext();
  if (tenant.chapterSlug !== "root") throw new AuthorizationError("CHAPTER_SCOPE_MISMATCH", "Shoes for Kids belongs to Tau Sigma.");
  const { data: aal } = await member.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") throw new AuthorizationError("MFA_REQUIRED", "Multi-factor authentication is required.");
  if (member.role === "super_admin") return { member, role: "super" as const, chapterId: tenant.chapterId };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const database = createAdminClient() as any;
  const { data: assignment, error } = await database.from("shoe_staff_roles").select("role")
    .eq("chapter_id", tenant.chapterId).eq("user_id", member.user.id).maybeSingle();
  if (error) throw error;
  const role = assignment?.role as ShoeStaffRole | undefined;
  if (role && ["director", "committee", "finance", "distribution"].includes(role)) return { member, role, chapterId: tenant.chapterId };
  if (member.role === "chapter_admin") return { member, role: "director" as const, chapterId: tenant.chapterId };
  throw new AuthorizationError("INSUFFICIENT_ROLE", "Shoes for Kids staff assignment required.");
}

export async function requireShoeRole(allowed: readonly ShoeStaffRole[]) {
  const staff = await requireShoeStaff();
  if (staff.role !== "super" && !allowed.includes(staff.role)) {
    throw new AuthorizationError("INSUFFICIENT_ROLE", "This campaign role cannot perform that operation.");
  }
  return staff;
}
