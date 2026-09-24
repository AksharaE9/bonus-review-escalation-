import { z } from "zod";

export const BonusTypeEnumSchema = z.enum([
  "PERFORMANCE",
  "SPOT",
  "REFERRAL",
  "FESTIVE",
  "RETENTION",
  "PROJECT",
  "MILESTONE",
  "OTHER",
]);

export const BonusStatusEnumSchema = z.enum([
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "PAID",
  "CANCELLED",
]);

export const CreateBonusSchema = z.object({
  employeeId: z.string().uuid("Please select a valid employee"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => {
      const n = parseFloat(val.replace(/,/g, ""));
      return !isNaN(n) && n > 0;
    }, "Amount must be a positive number"),
  currency: z.string().length(3).default("INR"),
  bonusType: BonusTypeEnumSchema,
  reason: z
    .string()
    .trim()
    .min(10, "Reason must be at least 10 characters long explaining the award justification"),
  periodMonth: z.string().optional().nullable(),
  linkedReviewId: z.string().uuid().optional().nullable(),
});

export const ApproveBonusSchema = z.object({
  bonusId: z.string().uuid(),
});

export const RejectBonusSchema = z.object({
  bonusId: z.string().uuid(),
  rejectionReason: z
    .string()
    .trim()
    .min(10, "A detailed rejection reason (min 10 characters) is mandatory"),
});

export const MarkPaidBonusSchema = z.object({
  bonusId: z.string().uuid(),
  payoutDate: z.string().min(1, "Payout date is required"),
});

export const BulkApproveBonusesSchema = z.object({
  bonusIds: z.array(z.string().uuid()).min(1, "Select at least one bonus"),
});

export type CreateBonusInput = z.infer<typeof CreateBonusSchema>;
export type RejectBonusInput = z.infer<typeof RejectBonusSchema>;
export type MarkPaidBonusInput = z.infer<typeof MarkPaidBonusSchema>;
