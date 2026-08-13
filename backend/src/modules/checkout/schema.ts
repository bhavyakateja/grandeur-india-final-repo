import { z } from "zod";

export const checkoutSchema = z.object({
  addressId: z.string().cuid(),

  couponCode: z.string().optional(),
});

export type CheckoutInput =
  z.infer<typeof checkoutSchema>;