import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import * as service from "./service";

import {
  createReviewSchema,
  updateReviewSchema,
} from "./schema";

import { authMiddleware } from "../../middleware/authMiddleware";
import { cache, CacheKeys } from "../redis";

export const reviewController = new Hono();

reviewController.post(
  "/",
  authMiddleware,
  zValidator("json", createReviewSchema),
  async (c) => {
    const user = c.get("user");

    const body = c.req.valid("json");

    const review = await service.create(
      user.id,
      body
    );

    return c.json(review, 201);
  }
);

reviewController.get(
  "/product/:productId",
  cache((c) => CacheKeys.productReviews(c.req.param("productId") ?? "")),
  async (c) => {
    const reviews =
      await service.getProductReviews(
        c.req.param("productId")!
      );

    return c.json(reviews);
  }
);

reviewController.get(
  "/:id",
  async (c) => {
    const review = await service.getReview(
      c.req.param("id")!
    );

    return c.json(review);
  }
);

reviewController.patch(
  "/:id",
  authMiddleware,
  zValidator("json", updateReviewSchema),
  async (c) => {
    const user = c.get("user");

    const review = await service.update(
      user.id,
      c.req.param("id")!,
      c.req.valid("json")
    );

    return c.json(review);
  }
);

reviewController.delete(
  "/:id",
  authMiddleware,
  async (c) => {
    const user = c.get("user");

    const result = await service.remove(
      user.id,
      c.req.param("id")!
    );

    return c.json(result);
  }
);

reviewController.get(
  "/product/:productId/rating",
  cache((c) => CacheKeys.productRating(c.req.param("productId") ?? "")),
  async (c) => {
    const rating =
      await service.getAverageRating(
        c.req.param("productId")!
      );

    return c.json(rating);
  }
);
