import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z.string().cuid(),
});

export type CreateOrderInput = z.infer<
  typeof createOrderSchema
>;