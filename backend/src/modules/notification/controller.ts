import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import * as service from "./service";
import { sendEmailSchema } from "./schema";

import { authMiddleware } from "../../middleware/authMiddleware";
import { roleMiddleware } from "../../middleware/roleMiddleware";

export const notificationController = new Hono();

notificationController.use("*", authMiddleware);
notificationController.use("*", roleMiddleware("ADMIN"));

notificationController.post(
  "/email",
  zValidator("json", sendEmailSchema),
  async (c) => {
    const body = c.req.valid("json");

    const result = await service.email(body);

    return c.json(
      {
        success: true,
        message: "Email sent successfully",
        data: result,
      },
      202,
    );
  },
);