import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import * as service from "./service";

import {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
} from "./schema";

import { authMiddleware } from "../../middleware/authMiddleware";
import { roleMiddleware } from "../../middleware/roleMiddleware";
import { cache, CacheKeys } from "../redis";

export const categoryController = new Hono();

// Create Category (Admin)
categoryController.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "SUPER_ADMIN"),
  zValidator("json", createCategorySchema),
  async (c) => {
    const body = c.req.valid("json");

    const category = await service.create(body);

    return c.json(category, 201);
  }
);

// Get All Categories
categoryController.get(
  "/",
  zValidator("query", categoryQuerySchema),
  cache((c) => {
    const query = new URL(c.req.url).searchParams;
    const suffix = [...query.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("&");
    return suffix ? `${CacheKeys.categories()}:${suffix}` : CacheKeys.categories();
  }),
  async (c) => {
    const query = c.req.valid("query");

    const categories = await service.getAll(query);

    return c.json(categories);
  }
);

// Get Category By ID
categoryController.get("/:id", cache((c) => CacheKeys.category(c.req.param("id") ?? "")), async (c) => {
  const id = c.req.param("id")!;

  const category = await service.getById(id);

  return c.json(category);
});

// Update Category (Admin)
categoryController.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "SUPER_ADMIN"),
  zValidator("json", updateCategorySchema),
  async (c) => {
    const id = c.req.param("id")!;

    const body = c.req.valid("json");

    const category = await service.update(id, body);

    return c.json(category);
  }
);

// Delete Category (Admin)
categoryController.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "SUPER_ADMIN"),
  async (c) => {
    const id = c.req.param("id")!;

    await service.remove(id);

    return c.json({
      success: true,
      message: "Category deleted successfully",
    });
  }
);
