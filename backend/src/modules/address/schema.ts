import { z } from "zod";

const optionalNullableString = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .nullable()
    .optional();

export const createAddressSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2)
    .max(100),

  phone: z
    .string()
    .trim()
    .min(7, "Phone number too short")
    .max(20, "Phone number too long")
    .regex(/^(\+?[0-9\s\-()]{7,20}|[6-9]\d{9})$/, "Invalid phone number format"),

  addressLine1: z
    .string()
    .trim()
    .min(5)
    .max(200),

  addressLine2: optionalNullableString(1, 200),

  city: z
    .string()
    .trim()
    .min(2)
    .max(100),

  state: z
    .string()
    .trim()
    .min(2)
    .max(100),

  country: z
    .string()
    .trim()
    .min(2)
    .max(100),

  postalCode: z
    .string()
    .trim()
    .min(3, "Postal code too short")
    .max(12, "Postal code too long")
    .regex(/^([A-Za-z0-9\s\-]{3,12}|\d{6})$/, "Invalid postal code format"),

  isDefault: z
    .boolean()
    .default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;