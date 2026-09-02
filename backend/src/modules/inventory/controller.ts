import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import * as service from "./service";
import {
  updateStockSchema,
  stockCheckSchema,
} from "./schema";

import { authMiddleware } from "../../middleware/authMiddleware";
import { roleMiddleware } from "../../middleware/roleMiddleware";
import { Role } from "../../generated/prisma/client";

export const inventoryController = new Hono();

inventoryController.use("*", authMiddleware);
inventoryController.use("*", roleMiddleware(Role.ADMIN));

/**
 * Update product stock.
 * Admin only.
 */
inventoryController.patch(
  "/:productId",
  zValidator("json", updateStockSchema),
  async (c) => {
    const productId = c.req.param("productId");
    const { stock } = c.req.valid("json");

    const product = await service.setStock(productId, stock);

    return c.json(product);
  },
);

/**
 * Check product stock.
 */
inventoryController.get(
  "/:productId",
  zValidator("query", stockCheckSchema),
  async (c) => {
    const productId = c.req.param("productId");
    const { quantity } = c.req.valid("query");

    const result = await service.validateStock(
      productId,
      quantity,
    );

    return c.json(result);
  },
);

export { inventoryRouter } from "./routes";