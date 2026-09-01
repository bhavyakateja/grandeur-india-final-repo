import { Hono } from "hono";

import { invoiceController } from "./controller";

export const invoiceRouter = new Hono();

invoiceRouter.route(
  "/",
  invoiceController,
);