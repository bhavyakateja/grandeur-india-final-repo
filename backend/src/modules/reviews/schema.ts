import { z } from "zod";

export const createReviewSchema = z.object({
  productId: z.string().cuid(),

  rating: z.number().int().min(1).max(5),

  title: z.string().max(100).optional(),

  comment: z.string().max(1000).optional(),

  images: z.array(z.string().url()).max(5).optional().default([]),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),

  title: z.string().max(100).optional(),

  comment: z.string().max(1000).optional(),

  images: z.array(z.string().url()).max(5).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;