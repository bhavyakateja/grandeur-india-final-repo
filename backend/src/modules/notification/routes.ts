import { Hono } from "hono";
import { notificationController } from "./controller";

export const notificationRouter = new Hono();

notificationRouter.route(
  "/",
  notificationController,
);