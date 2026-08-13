import { z } from "zod";

export const createAddressSchema = z.object({
  fullName: z.string().min(2).max(100),

  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid phone number"),

  addressLine1: z.string().min(5).max(200),

  addressLine2: z.string().optional(),

  city: z.string().min(2).max(100),

  state: z.string().min(2).max(100),

  country: z.string().min(2).max(100),

  postalCode: z
    .string()
    .regex(/^\d{6}$/, "Invalid postal code"),

  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema =
  createAddressSchema.partial();

export type CreateAddressInput = z.infer<
  typeof createAddressSchema
>;

export type UpdateAddressInput = z.infer<
  typeof updateAddressSchema
>;