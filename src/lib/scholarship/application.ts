import { z } from "zod";

export const SCHOLARSHIP_DEADLINE = new Date("2027-01-28T00:00:00-06:00");
export const SCHOLARSHIP_DEADLINE_LABEL = "January 27, 2027 at 11:59 p.m. Central";
export const SCHOLARSHIP_BUCKET = "scholarship-applications";
export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const SCHOLARSHIP_FILES = [
  { name: "transcript", label: "Official transcript", accept: ".pdf,.jpg,.jpeg,.png", maxBytes: 10_000_000 },
  { name: "resume", label: "Professional résumé", accept: ".pdf,.jpg,.jpeg,.png", maxBytes: 10_000_000 },
  { name: "acceptanceLetter", label: "College acceptance letter", accept: ".pdf,.jpg,.jpeg,.png", maxBytes: 10_000_000 },
  { name: "recommendationLetter", label: "Recommendation letter", accept: ".pdf,.jpg,.jpeg,.png", maxBytes: 10_000_000 },
  { name: "photograph", label: "Dress-attire photograph", accept: ".jpg,.jpeg,.png", maxBytes: 10_000_000 },
  { name: "essay", label: "Essay", accept: ".pdf,.docx", maxBytes: 5_000_000 },
] as const;

export type ScholarshipFileName = (typeof SCHOLARSHIP_FILES)[number]["name"];

const contentTypes = {
  pdf: "application/pdf",
  docx: DOCX_MIME,
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
} as const;

export function getScholarshipContentType(name: ScholarshipFileName, filename: string) {
  if (typeof filename !== "string" || filename.length > 255) return null;
  const extension = /\.([a-z0-9]+)$/i.exec(filename)?.[1]?.toLowerCase();
  if (!extension || !(extension in contentTypes)) return null;
  if (name === "essay" && extension !== "pdf" && extension !== "docx") return null;
  if (name === "photograph" && extension !== "jpg" && extension !== "jpeg" && extension !== "png") return null;
  if (name !== "essay" && extension === "docx") return null;
  return { extension, contentType: contentTypes[extension as keyof typeof contentTypes] };
}

export const citizenshipOptions = [
  "U.S. citizen",
  "U.S. permanent resident",
  "Other citizenship status",
  "Prefer not to answer",
] as const;

export const raceOptions = [
  "American Indian or Alaska Native",
  "Asian",
  "Black or African American",
  "Native Hawaiian or Other Pacific Islander",
  "White",
  "More than one race",
  "Another race",
  "Prefer not to answer",
] as const;

export const ethnicityOptions = [
  "Hispanic or Latino",
  "Not Hispanic or Latino",
  "Another ethnicity",
  "Prefer not to answer",
] as const;

export const scholarshipApplicationSchema = z.object({
  legalName: z.string().trim().min(2).max(200),
  email: z.email().max(254),
  address: z.string().trim().min(5).max(300),
  school: z.string().trim().min(2).max(200),
  phone: z.string().trim().min(7).max(30),
  dateOfBirth: z.iso.date(),
  age: z.coerce.number().int().min(14).max(25),
  citizenship: z.enum(citizenshipOptions),
  race: z.enum(raceOptions),
  ethnicity: z.enum(ethnicityOptions),
  gpa: z.coerce.number().min(2.75).max(5),
  major: z.string().trim().min(2).max(200),
  intendedSchool: z.string().trim().min(2).max(200),
  eligibility: z.literal("yes"),
  agreement: z.literal("yes"),
  website: z.string().max(0).optional().or(z.literal("")),
});

export function isScholarshipOpen(date = new Date()) {
  return date.getTime() < SCHOLARSHIP_DEADLINE.getTime();
}
