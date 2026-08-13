import { ProductStatus } from "../../generated/prisma/client";
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(3).max(150),
  description: z.string().trim().min(10),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
  categoryId: z.string().cuid(),
  status: z.nativeEnum(ProductStatus).optional(),
});

export const updateProductSchema =
  createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),

  limit: z.coerce.number().min(1).max(100).default(10),

  search: z.string().optional(),

  category: z.string().optional(),

  status: z.nativeEnum(ProductStatus).optional(),

  sort: z
    .enum([
      "createdAt",
      "-createdAt",
      "price",
      "-price",
      "name",
      "-name",
    ])
    .default("-createdAt"),
});

export type CreateProductInput =
  z.infer<typeof createProductSchema>;

export type UpdateProductInput =
  z.infer<typeof updateProductSchema>;

export type ProductQuery =
  z.infer<typeof productQuerySchema>;