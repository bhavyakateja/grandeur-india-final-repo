import { Hono } from "hono";

import { inventoryController } from "./controller";

export const inventoryRouter = new Hono();

inventoryRouter.route(
  "/",
  inventoryController
);