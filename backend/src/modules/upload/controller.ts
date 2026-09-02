import { Hono } from "hono";

import { authMiddleware } from "../../middleware/authMiddleware";
import { roleMiddleware } from "../../middleware/roleMiddleware";

import * as service from "./service";

export const uploadController = new Hono();

uploadController.use("*", authMiddleware);
uploadController.use("*", roleMiddleware("ADMIN"));

uploadController.post("/", async (c) => {
  const body = await c.req.parseBody();

  const file = body.file;

  const folder = String(
    body.folder ?? "products"
  );

  if (!(file instanceof File)) {
    return c.json(
      {
        message: "File is required",
      },
      400
    );
  }

  const uploaded = await service.upload(
    file,
    folder
  );

  return c.json(uploaded);
});