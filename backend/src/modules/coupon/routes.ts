import { Hono } from "hono";

import { couponController } from "./controller";

export const couponRouter = new Hono();

couponRouter.route("/", couponController);