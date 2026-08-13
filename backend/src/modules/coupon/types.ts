import type { Coupon } from "../../generated/prisma/client";

export interface ApplyCouponResult {
  coupon: Coupon;

  discount: number;

  finalAmount: number;
}