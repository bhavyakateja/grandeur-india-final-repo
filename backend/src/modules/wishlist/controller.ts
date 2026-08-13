import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import * as service from "./service";

import { addToWishlistSchema } from "./schema";

import { authMiddleware } from "../../middleware/authMiddleware";
import { cache, CacheKeys } from "../redis";

export const wishlistController = new Hono();

wishlistController.use("*", authMiddleware);

// Add to Wishlist
wishlistController.post(
  "/",
  zValidator("json", addToWishlistSchema),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");

    const item = await service.addToWishlist(
      user.id,
      body
    );

    return c.json(item, 201);
  }
);

// Get Wishlist
wishlistController.get("/", cache((c) => CacheKeys.wishlist(c.get("user").id)), async (c) => {
  const user = c.get("user");

  const wishlist = await service.getWishlist(
    user.id
  );

  return c.json(wishlist);
});

// Remove from Wishlist
wishlistController.delete("/:productId", async (c) => {
  const user = c.get("user");
  const productId = c.req.param("productId");

  await service.removeFromWishlist(
    user.id,
    productId
  );

  return c.json({
    success: true,
    message: "Product removed from wishlist successfully",
  });
});
