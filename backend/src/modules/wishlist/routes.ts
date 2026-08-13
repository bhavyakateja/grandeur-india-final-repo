import { Hono } from "hono";

import { wishlistController } from "./controller";

export const wishlistRouter = new Hono();

wishlistRouter.route("/", wishlistController);