import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import * as service from "./service";

import {
  createPaymentSchema,
  verifyPaymentSchema,
} from "./schema";

import { authMiddleware } from "../../middleware/authMiddleware";

export const paymentController = new Hono();

// Keep provider webhooks public; authentication applies only to customer APIs.
paymentController.use("/create-order", authMiddleware);
paymentController.use("/verify", authMiddleware);
paymentController.use("/:id", authMiddleware);

// Create Payment
paymentController.post(
  "/create-order",
  zValidator("json", createPaymentSchema),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");

    const payment = await service.createPayment(
      user.id,
      body
    );

    return c.json(payment, 201);
  }
);

// Verify Payment
paymentController.post(
  "/verify",
  zValidator("json", verifyPaymentSchema),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");

    const order = await service.verifyPayment(
      user.id,
      body
    );

    return c.json(order);
  }
);

// Get Payment
paymentController.get("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const payment = await service.getPayment(
    id,
    user.id
  );

  return c.json(payment);
});
