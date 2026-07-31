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
