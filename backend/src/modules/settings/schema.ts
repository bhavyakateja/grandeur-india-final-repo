import { z } from "zod";

export const updateSettingsSchema = z.object({
  currency: z
    .string()
    .trim()
    .length(3)
    .toUpperCase()
    .optional(),

  gstRate: z
    .number()
    .min(0)
    .max(100)
    .optional(),

  freeShippingThreshold: z
    .number()
    .min(0)
    .optional(),

  defaultShippingCharge: z
    .number()
    .min(0)
    .optional(),

  codEnabled: z
    .boolean()
    .optional(),

  internationalShippingEnabled: z
    .boolean()
    .optional(),

  storeEnabled: z
    .boolean()
    .optional(),
});

export type UpdateSettingsInput =
  z.infer<typeof updateSettingsSchema>;