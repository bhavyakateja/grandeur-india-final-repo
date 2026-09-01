import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as service from "./service";
import {
  createAddressSchema,
  updateAddressSchema,
} from "./schema";
import { authMiddleware } from "../../middleware/authMiddleware";
import { successResponse } from "../../shared/response";

export const addressController = new Hono();

addressController.use("*", authMiddleware);

addressController.post(
  "/",
  zValidator("json", createAddressSchema),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");

    const address = await service.create(
      user.id,
      body,
    );

    return successResponse(
      c,
      address,
      "Address created successfully",
      201,
    );
  },
);

addressController.get("/", async (c) => {
  const user = c.get("user");

  const addresses = await service.getAll(user.id);

  return successResponse(c, addresses);
});

addressController.put(
  "/:id",
  zValidator("json", updateAddressSchema),
  async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const address = await service.update(
      id,
      user.id,
      body,
    );

    return successResponse(
      c,
      address,
      "Address updated successfully",
    );
  },
);

addressController.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  await service.remove(id, user.id);

  return successResponse(
    c,
    null,
    "Address deleted successfully",
  );
});