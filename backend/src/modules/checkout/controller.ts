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
    const input = c.req.valid("json");

    const checkout = await service.checkout(
      user.id,
      input,
    );

    return c.json({
      success: true,
      data: checkout,
    });
  },
);

export { checkoutRouter } from "./routes";