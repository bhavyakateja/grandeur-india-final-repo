import { Hono } from "hono";

import { settingsController } from "./controller";

export const settingsRouter = new Hono();

settingsRouter.route(
  "/",
  settingsController,
);