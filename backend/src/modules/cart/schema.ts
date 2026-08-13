import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().cuid(),

  quantity: z.number().int().min(1).max(10),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(10),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

export type UpdateCartItemInput = z.infer<
  typeof updateCartItemSchema
>;