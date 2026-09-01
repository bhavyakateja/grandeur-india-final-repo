import { z } from "zod";

export const createPaymentSchema =
  z.object({
    addressId: z.string().cuid(),

    couponCode: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .optional(),
  });

export const verifyPaymentSchema =
  z.object({
    providerOrderId:
      z.string().min(1),

    providerPaymentId:
      z.string().min(1),

    signature:
      z.string().min(1),
  });

export type CreatePaymentInput =
  z.infer<
    typeof createPaymentSchema
  >;

export type VerifyPaymentInput =
  z.infer<
    typeof verifyPaymentSchema
  >;