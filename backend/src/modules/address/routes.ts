import { Hono } from "hono";

import { addressController } from "./controller";

export const addressRouter = new Hono();

addressRouter.route("/", addressController);