import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import * as service from "./service";

import {
  createAddressSchema,
  updateAddressSchema,
} from "./schema";

import { authMiddleware } from "../../middleware/authMiddleware";

export const addressController = new Hono();

addressController.use("*", authMiddleware);

// Create Address
addressController.post(
  "/",
  zValidator("json", createAddressSchema),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");

    const address = await service.create(
      user.id,
      body
    );

    return c.json(address, 201);
  }
);

// Get My Addresses
addressController.get("/", async (c) => {
  const user = c.get("user");

  const addresses = await service.getAll(user.id);

  return c.json(addresses);
});

// Update Address
addressController.put(
  "/:id",
  zValidator("json", updateAddressSchema),
  async (c) => {
    const user = c.get("user");
    const id = c.req.param("id")!;

    const body = c.req.valid("json");

    const address = await service.update(
      id,
      user.id,
      body
    );

    return c.json(address);
  }
);

// Delete Address
addressController.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id")!;

  await service.remove(id, user.id);

  return c.json({
    success: true,
    message: "Address deleted successfully",
  });
});