import { Hono } from "hono";
import * as service from "./service";

import { authMiddleware } from "../../middleware/authMiddleware";

export const orderController = new Hono();

orderController.use("*", authMiddleware);

// Get My Orders
orderController.get("/", async (c) => {
  const user = c.get("user");

  const orders = await service.getOrders(user.id);

  return c.json(orders);
});

// Get Order By Id
orderController.get("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const order = await service.getOrderById(
    id,
    user.id
  );

  return c.json(order);
});

// Cancel Order
orderController.patch("/:id/cancel", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const order = await service.cancelOrder(
    id,
    user.id
  );

  return c.json(order);
});
