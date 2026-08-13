import { Hono } from "hono";

import { cartController } from "./controller";

export const cartRouter = new Hono();

cartRouter.route("/", cartController);