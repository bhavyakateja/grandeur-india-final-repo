import { z } from "zod";

export const createCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .transform((value) => value.toUpperCase()),

  description: z.string().max(255).optional(),

  type: z.enum(["PERCENTAGE", "FIXED"]),

  value: z.coerce.number().positive(),

  minimumOrderAmount: z.coerce.number().nonnegative().optional(),

  maximumDiscount: z.coerce.number().positive().optional(),

  usageLimit: z.coerce.number().int().positive().optional(),

  startsAt: z.coerce.date().optional(),

  expiresAt: z.coerce.date().optional(),

  isActive: z.boolean().optional().default(true),
});

export const updateCouponSchema = createCouponSchema.partial();

export const applyCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .transform((value) => value.toUpperCase()),

  subtotal: z.coerce.number().positive(),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;