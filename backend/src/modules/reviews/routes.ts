import { Hono } from "hono";

import { reviewController } from "./controller";

export const reviewRouter = new Hono();

reviewRouter.route("/", reviewController);