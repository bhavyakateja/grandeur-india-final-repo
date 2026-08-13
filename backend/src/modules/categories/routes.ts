import { Hono } from "hono";

import { categoryController } from "./controller";

export const categoryRouter = new Hono();

categoryRouter.route("/", categoryController);