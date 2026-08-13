import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import * as service from "./service";

import {
  createCouponSchema,
  updateCouponSchema,
  applyCouponSchema,
} from "./schema";

import { authMiddleware } from "../../middleware/authMiddleware";
import { roleMiddleware } from "../../middleware/roleMiddleware";
import { Role } from "../../generated/prisma/client";

export const couponController = new Hono();

couponController.use("*", authMiddleware);

/**
 * Customer
 */
couponController.post(
  "/apply",
  zValidator("json", applyCouponSchema),
  async (c) => {
    const user = c.get("user");

    const body = c.req.valid("json");

    const result = await service.applyCoupon(
      user.id,
      body
    );

    return c.json(result);
  }
);

/**
 * Admin
 */
couponController.post(
  "/",
  roleMiddleware(Role.ADMIN, Role.SUPER_ADMIN),
  zValidator("json", createCouponSchema),
  async (c) => {
    const body = c.req.valid("json");

    const coupon = await service.create(body);

    return c.json(coupon, 201);
  }
);

couponController.get(
  "/",
  roleMiddleware(Role.ADMIN, Role.SUPER_ADMIN),
  async (c) => {
    const coupons = await service.findAll();

    return c.json(coupons);
  }
);

couponController.get(
  "/:id",
  roleMiddleware(Role.ADMIN, Role.SUPER_ADMIN),
  async (c) => {
    const coupon = await service.findById(
      c.req.param("id")
    );

    return c.json(coupon);
  }
);

couponController.patch(
  "/:id",
  roleMiddleware(Role.ADMIN, Role.SUPER_ADMIN),
  zValidator("json", updateCouponSchema),
  async (c) => {
    const coupon = await service.update(
      c.req.param("id"),
      c.req.valid("json")
    );

    return c.json(coupon);
  }
);

couponController.delete(
  "/:id",
  roleMiddleware(Role.ADMIN, Role.SUPER_ADMIN),
  async (c) => {
    await service.remove(c.req.param("id"));

    return c.json({
      success: true,
    });
  }
);
