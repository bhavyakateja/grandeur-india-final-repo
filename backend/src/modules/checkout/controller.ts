import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import * as service from "./service";

import { checkoutSchema } from "./schema";

import { authMiddleware } from "../../middleware/authMiddleware";

export const checkoutController = new Hono();

checkoutController.use("*", authMiddleware);

checkoutController.post(
  "/",
  zValidator("json", checkoutSchema),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");

    const checkout = await service.checkout(
      user.id,
      body
    );

    return c.json(checkout);
  }
);