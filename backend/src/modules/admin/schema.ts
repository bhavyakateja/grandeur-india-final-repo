import {
  OrderStatus,
  PaymentStatus,
  ReviewStatus,
} from "../../generated/prisma/client";
import { z } from "zod";

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(OrderStatus).optional(),
  search: z.string().trim().min(1).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const reviewListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(ReviewStatus).optional(),
  search: z.string().trim().min(1).optional(),
});

export const updateReviewStatusSchema = z.object({
  status: z.nativeEnum(ReviewStatus),
});

export const attachProductImageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().trim().min(1).max(500),
  isPrimary: z.boolean().default(false),
});

export const paymentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(PaymentStatus).optional(),
  search: z.string().trim().min(1).optional(),
});

export const refundPaymentSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const analyticsQuerySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine(
    (data) =>
      !data.from ||
      !data.to ||
      data.from <= data.to,
    {
      message: "'from' date must be before 'to' date",
      path: ["from"],
    },
  );

export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
export type UpdateOrderStatusInput = z.infer<
  typeof updateOrderStatusSchema
>;

export type ReviewListQuery = z.infer<
  typeof reviewListQuerySchema
>;
export type UpdateReviewStatusInput = z.infer<
  typeof updateReviewStatusSchema
>;

export type AttachProductImageInput = z.infer<
  typeof attachProductImageSchema
>;

export type PaymentListQuery = z.infer<
  typeof paymentListQuerySchema
>;

export type RefundPaymentInput = z.infer<
  typeof refundPaymentSchema
>;

export type AnalyticsQuery = z.infer<
  typeof analyticsQuerySchema
>;