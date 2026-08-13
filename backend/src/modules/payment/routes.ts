import { Hono } from "hono";

import { paymentController } from "./controller";
import { webhookController } from "./webhook";

export const paymentRouter = new Hono();

paymentRouter.route("/", paymentController);

paymentRouter.route("/webhook", webhookController);