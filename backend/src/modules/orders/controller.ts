import { Hono } from "hono";

import * as service from "./service";
import { authMiddleware } from "../../middleware/authMiddleware";

export const orderController = new Hono();

orderController.use("*", authMiddleware);

/**
 * Get current user's orders.
 */
orderController.get("/", async (c) => {
  const user = c.get("user");

  const orders = await service.getOrders(user.id);

  return c.json(orders);
});

/**
 * Get a single order belonging to the current user.
 */
orderController.get("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const order = await service.getOrderById(
    id,
    user.id,
  );

  return c.json(order);
});

/**
 * Cancel an unpaid pending order.
 */
orderController.patch("/:id/cancel", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const order = await service.cancelOrder(
    id,
    user.id,
  );

  return c.json(order);
});