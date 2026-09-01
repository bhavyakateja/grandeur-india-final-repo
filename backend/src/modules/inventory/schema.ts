import { z } from "zod";

export const updateStockSchema = z.object({
  stock: z.coerce.number().int().min(0).max(1_000_000),
});

export const stockCheckSchema = z.object({
  quantity: z.coerce.number().int().positive().max(1_000_000),
});

export type UpdateStockInput = z.infer<typeof updateStockSchema>;
export type StockCheckInput = z.infer<typeof stockCheckSchema>;