import { z } from "zod";

export const scholarshipApplicationSchema = z.object({
  scholarship: z.string().trim().min(1).max(500), legalName: z.string().trim().min(2).max(200), email: z.string().email().max(254), address: z.string().trim().min(5).max(300), school: z.string().trim().min(2).max(200), phone: z.string().trim().min(7).max(30), dateOfBirth: z.string().date(), age: z.coerce.number().int().min(14).max(25), citizenship: z.string().trim().min(1).max(100), race: z.string().trim().min(1).max(100), ethnicity: z.string().trim().min(1).max(100), gpa: z.coerce.number().min(0).max(5), major: z.string().trim().min(2).max(200), intendedSchool: z.string().trim().min(2).max(200), essay: z.string().trim().min(20).max(10000), agreement: z.literal("yes"), website: z.string().max(0).optional().or(z.literal("")),
});
export function isScholarshipOpen(date = new Date()) { const month = date.getMonth() + 1; return month >= 10 || month <= 2; }
