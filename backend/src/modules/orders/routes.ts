import { Hono } from "hono";

import { orderController } from "./controller";

export const orderRouter = new Hono();

orderRouter.route("/", orderController);