import { Hono } from "hono";

import * as service from "./service";

export const webhookController =
  new Hono();

webhookController.post(
  "/razorpay",
  async (c) => {
    /*
     * IMPORTANT:
     * Read the raw body before any JSON parsing.
     * Razorpay signature verification depends on
     * the exact raw request body.
     */
    const body =
      await c.req.text();

    const signature =
      c.req.header(
        "x-razorpay-signature",
      ) ?? "";

    await service.handleRazorpayWebhook(
      body,
      signature,
    );

    return c.json({
      success: true,
    });
  },
);