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
import * as checkoutService from "../checkout/service";

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

    const input = c.req.valid("json");
    const subtotal = await checkoutService.getCartSubtotal(user.id);
    const result = await service.applyCoupon(user.id, {
      code: input.code,
      subtotal,
    });

    return c.json({
      success: true,
      data: result,
    });
  },
);

/**
 * Admin
 */
couponController.post(
  "/",
  roleMiddleware("ADMIN"),
  zValidator("json", createCouponSchema),
  async (c) => {
    const coupon = await service.create(
      c.req.valid("json"),
    );

    return c.json(
      {
        success: true,
        data: coupon,
      },
      201,
    );
  },
);

couponController.get(
  "/",
  roleMiddleware("ADMIN"),
  async (c) => {
    const coupons = await service.findAll();

    return c.json({
      success: true,
      data: coupons,
    });
  },
);

couponController.get(
  "/:id",
  roleMiddleware("ADMIN"),
  async (c) => {
    const coupon = await service.findById(
      c.req.param("id"),
    );

    return c.json({
      success: true,
      data: coupon,
    });
  },
);

couponController.patch(
  "/:id",
  roleMiddleware("ADMIN"),
  zValidator("json", updateCouponSchema),
  async (c) => {
    const coupon = await service.update(
      c.req.param("id"),
      c.req.valid("json"),
    );

    return c.json({
      success: true,
      data: coupon,
    });
  },
);

couponController.delete(
  "/:id",
  roleMiddleware("ADMIN"),
  async (c) => {
    await service.remove(
      c.req.param("id"),
    );

    return c.json({
      success: true,
      message: "Coupon deactivated successfully",
    });
  },
);

export { couponRouter } from "./routes";
