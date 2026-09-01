import { Hono } from "hono";

import { checkoutController } from "./controller";

export const checkoutRouter = new Hono();

checkoutRouter.route(
  "/",
  checkoutController,
);