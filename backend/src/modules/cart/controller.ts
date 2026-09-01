import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import * as service from "./service";
import {
  addToCartSchema,
  updateCartItemSchema,
} from "./schema";

import { authMiddleware } from "../../middleware/authMiddleware";
import { cache, CacheKeys } from "../redis";

export const cartController = new Hono();

cartController.use("*", authMiddleware);

cartController.post(
  "/",
  zValidator("json", addToCartSchema),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");

    const item = await service.addToCart(
      user.id,
      body,
    );

    return c.json(
      {
        success: true,
        data: item,
      },
      201,
    );
  },
);

cartController.get(
  "/",
  cache((c) =>
    CacheKeys.cart(c.get("user").id),
  ),
  async (c) => {
    const user = c.get("user");

    const cart = await service.getCart(user.id);

    return c.json({
      success: true,
      data: cart,
    });
  },
);

cartController.put(
  "/:itemId",
  zValidator("json", updateCartItemSchema),
  async (c) => {
    const user = c.get("user");
    const itemId = c.req.param("itemId");
    const body = c.req.valid("json");

    const item = await service.updateItem(
      itemId,
      user.id,
      body,
    );

    return c.json({
      success: true,
      data: item,
    });
  },
);

cartController.delete(
  "/:itemId",
  async (c) => {
    const user = c.get("user");
    const itemId = c.req.param("itemId");

    await service.removeItem(
      itemId,
      user.id,
    );

    return c.json({
      success: true,
      message: "Cart item removed successfully",
    });
  },
);