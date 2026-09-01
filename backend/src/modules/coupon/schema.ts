import { z } from "zod";

const couponCode = z
  .string()
  .trim()
  .min(3)
  .max(30)
  .transform((value) =>
    value.toUpperCase(),
  );

const couponDates = z
  .object({
    startsAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional(),
  })
  .refine(
    ({ startsAt, expiresAt }) =>
      !startsAt ||
      !expiresAt ||
      startsAt < expiresAt,
    {
      message:
        "Expiry date must be after start date",
      path: ["expiresAt"],
    },
  );

export const createCouponSchema = z
  .object({
    code: couponCode,

    description: z
      .string()
      .trim()
      .max(255)
      .optional(),

    type: z.enum([
      "PERCENTAGE",
      "FIXED",
    ]),

    value: z.coerce
      .number()
      .positive(),

    minimumOrderAmount: z.coerce
      .number()
      .nonnegative()
      .nullable()
      .optional(),

    maximumDiscount: z.coerce
      .number()
      .positive()
      .nullable()
      .optional(),

    usageLimit: z.coerce
      .number()
      .int()
      .positive()
      .nullable()
      .optional(),

    startsAt: z.coerce.date().optional(),

    expiresAt: z.coerce.date().optional(),

    isActive: z
      .boolean()
      .default(true),
  })
  .and(couponDates)
  .superRefine((data, ctx) => {
    if (
      data.type === "PERCENTAGE" &&
      data.value > 100
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message:
          "Percentage discount cannot exceed 100%",
      });
    }

    if (
      data.type === "FIXED" &&
      data.maximumDiscount !== undefined &&
      data.maximumDiscount !== null
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["maximumDiscount"],
        message:
          "Maximum discount is only applicable to percentage coupons",
      });
    }
  });

export const updateCouponSchema =
  z
    .object({
      code: couponCode.optional(),

      description: z
        .string()
        .trim()
        .max(255)
        .nullable()
        .optional(),

      type: z
        .enum([
          "PERCENTAGE",
          "FIXED",
        ])
        .optional(),

      value: z.coerce
        .number()
        .positive()
        .optional(),

      minimumOrderAmount: z.coerce
        .number()
        .nonnegative()
        .nullable()
        .optional(),

      maximumDiscount: z.coerce
        .number()
        .positive()
        .nullable()
        .optional(),

      usageLimit: z.coerce
        .number()
        .int()
        .positive()
        .nullable()
        .optional(),

      startsAt: z.coerce
        .date()
        .nullable()
        .optional(),

      expiresAt: z.coerce
        .date()
        .nullable()
        .optional(),

      isActive: z
        .boolean()
        .optional(),
    })
    .refine(
      (data) =>
        !data.startsAt ||
        !data.expiresAt ||
        data.startsAt < data.expiresAt,
      {
        message:
          "Expiry date must be after start date",
        path: ["expiresAt"],
      },
    );

export const applyCouponSchema =
  z.object({
    code: couponCode,
  });

export type CreateCouponInput =
  z.infer<
    typeof createCouponSchema
  >;

export type UpdateCouponInput =
  z.infer<
    typeof updateCouponSchema
  >;

export type ApplyCouponInput =
  z.infer<
    typeof applyCouponSchema
  >;
