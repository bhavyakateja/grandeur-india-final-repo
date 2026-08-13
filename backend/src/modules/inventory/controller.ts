import { Hono } from "hono";

import * as service from "./service";

import { authMiddleware } from "../../middleware/authMiddleware";
import { roleMiddleware } from "../../middleware/roleMiddleware";

import { Role } from "../../generated/prisma/client";

export const inventoryController =
  new Hono();

inventoryController.use("*", authMiddleware);

inventoryController.use(
  "*",
  roleMiddleware(Role.ADMIN, Role.SUPER_ADMIN)
);

inventoryController.patch(
  "/:productId",
  async (c) => {
    const body = await c.req.json();

    const result =
      await service.setStock(
        c.req.param("productId"),
        body.stock
      );

    return c.json(result);
  }
);

inventoryController.get(
  "/:productId",
  async (c) => {
    const stock =
      await service.validateStock(
        c.req.param("productId"),
        1
      );

    return c.json(stock);
  }
);