import { z } from "zod";

export const CAMPAIGN_CODE = "sfk-2026";
export const sizeSystems = ["toddler", "little-kid", "youth", "adult"] as const;
export const widths = ["standard", "wide", "extra-wide", "narrow"] as const;
export const gradeLevels = ["Pre-K", "Kindergarten", "1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade"] as const;
export const genders = ["Boy", "Girl", "Not specified"] as const;

export const selectionSchema = z.union([
  z.object({ requestId: z.string().uuid(), quantity: z.literal(1) }),
  z.object({
    sizeSystem: z.enum(sizeSystems),
    shoeSize: z.string().trim().min(1).max(12),
    width: z.enum(widths),
    shoeType: z.string().trim().min(1).max(80),
    quantity: z.number().int().min(1).max(20),
  }),
]);

export const reservationSchema = z.object({
  campaignId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  email: z.email().max(254),
  phone: z.string().trim().max(30).optional(),
  sponsorType: z.enum(["individual", "organization"]),
  organizationName: z.string().trim().max(160).optional(),
  recognitionConsent: z.boolean(),
  transactionalConsent: z.literal(true),
  deliveryAgreement: z.literal(true),
  deliveryMethod: z.enum(["dropoff", "coordinator"]),
  selections: z.array(selectionSchema).min(1).max(20),
  website: z.string().max(0).optional(),
}).refine((value) => value.sponsorType !== "organization" || Boolean(value.organizationName), {
  message: "Organization name is required.", path: ["organizationName"],
}).refine((value) => value.selections.reduce((n, item) => n + item.quantity, 0) <= 20, {
  message: "A reservation can contain at most 20 pairs.", path: ["selections"],
});

export type ShoeSelection = z.infer<typeof selectionSchema>;
export type ShoeReservationInput = z.infer<typeof reservationSchema>;

export interface PublicShoeRequest {
  id: string;
  publicRef: string;
  gradeLevel: string | null;
  gender: string | null;
  sizeSystem: string;
  shoeSize: string;
  width: string;
  shoeType: string;
}

export function shoeGroupKey(request: Pick<PublicShoeRequest, "gradeLevel" | "gender" | "sizeSystem" | "shoeSize" | "width" | "shoeType">) {
  return JSON.stringify([request.gradeLevel, request.gender, request.sizeSystem, request.shoeSize, request.width, request.shoeType]);
}

export interface PublicInventoryGroup {
  key: string;
  request: PublicShoeRequest;
  count: number;
  needed: number;
}

export interface PublicCampaign {
  id: string;
  code: string;
  name: string;
  year: number;
  status: string;
  physicalDeadline: string;
  reservationDays: number;
  dropoffLocation: string | null;
  dropoffHours: string | null;
  dropoffContact: string | null;
  dropoffInstructions: string | null;
  zeffyUrl: string | null;
  zeffyEmbedUrl: string | null;
  suggestedPairCents: number;
  showDonationTotal: boolean;
}

export interface PublicProgress {
  requested: number;
  fulfilled: number;
  reserved: number;
  outstanding: number;
  received: number;
  purchased: number;
  donationsCents: number | null;
}
