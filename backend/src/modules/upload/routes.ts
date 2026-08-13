import { Hono } from "hono";

import { uploadController } from "./controller";

export const uploadRouter = new Hono();

uploadRouter.route("/", uploadController);