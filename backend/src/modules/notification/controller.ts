import { Hono } from "hono";

import * as service from "./service";
import * as queue from "../queue";

import { authMiddleware } from "../../middleware/authMiddleware";
import { roleMiddleware } from "../../middleware/roleMiddleware";

export const notificationController =
  new Hono();

notificationController.use("*", authMiddleware);
notificationController.use("*", roleMiddleware("ADMIN", "SUPER_ADMIN"));

notificationController.post(
  "/email",
  async (c) => {
    const body = await c.req.json();

    await queue.enqueueEmail({
      to: body.to,
      subject: body.subject,
      message: body.message,
    });

    return c.json({
      success: true,
    }, 202);
  }
);

notificationController.post(
  "/sms",
  async (c) => {
    const body = await c.req.json();

    await service.sms(
      body.to,
      body.message
    );

    return c.json({
      success: true,
    });
  }
);

notificationController.post(
  "/push",
  async (c) => {
    const body = await c.req.json();

    await service.push(
      body.to,
      body.message
    );

    return c.json({
      success: true,
    });
  }
);
