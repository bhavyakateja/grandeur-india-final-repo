import { z } from "zod";

export const checkoutSchema = z.object({
  addressId: z.string().cuid(),

  couponCode: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .optional(),
});

export type CheckoutInput =
  z.infer<typeof checkoutSchema>;