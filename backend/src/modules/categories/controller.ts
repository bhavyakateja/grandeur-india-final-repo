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

/**
 * Admin routes
 */
categoryController.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  zValidator("json", createCategorySchema),
  async (c) => {
    const body = c.req.valid("json");

    const category = await service.create(body);

    return c.json(
      {
        success: true,
        data: category,
      },
      201,
    );
  },
);

/**
 * Public: list categories
 */
categoryController.get(
  "/",
  zValidator("query", categoryQuerySchema),
  cache((c) => {
    const search = c.req.query("search");

    return search
      ? `${CacheKeys.categories()}:search=${encodeURIComponent(search)}`
      : CacheKeys.categories();
  }),
  async (c) => {
    const query = categoryQuerySchema.parse(
      c.req.query(),
    );

    const categories = await service.getAll(query);

    return c.json({
      success: true,
      data: categories,
    });
  },
);

/**
 * Public: get category
 */
categoryController.get(
  "/:id",
  async (c, next) => {
    const id = c.req.param("id");

    return cache(() => CacheKeys.category(id))(
      c,
      next,
    );
  },
  async (c) => {
    const id = c.req.param("id");

    const category = await service.getById(id);

    return c.json({
      success: true,
      data: category,
    });
  },
);

/**
 * Admin: update category
 */
categoryController.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  zValidator("json", updateCategorySchema),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const category = await service.update(
      id,
      body,
    );

    return c.json({
      success: true,
      data: category,
    });
  },
);

/**
 * Admin: deactivate category
 */
categoryController.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  async (c) => {
    const id = c.req.param("id");

    await service.remove(id);

    return c.json({
      success: true,
      message: "Category deactivated successfully",
    });
  },
);

export { categoryRouter } from "./routes";