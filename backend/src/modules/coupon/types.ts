import type { Coupon, Prisma } from "../../generated/prisma/client";

export interface ApplyCouponResult {
  coupon: Coupon;
  discount: Prisma.Decimal;
  finalAmount: Prisma.Decimal;
}
