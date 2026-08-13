import { Hono } from "hono";

import * as service from "./service";

export const webhookController = new Hono();

webhookController.post("/razorpay", async (c) => {
  const body = await c.req.text();

  const signature = c.req.header("x-razorpay-signature") ?? "";

  await service.handleRazorpayWebhook(body, signature);

  return c.json({ success: true });
});

webhookController.post("/stripe", async (c) => {
  const body = await c.req.text();

  const signature = c.req.header("stripe-signature") ?? "";

  await service.handleStripeWebhook(body, signature);

  return c.json({ success: true });
});