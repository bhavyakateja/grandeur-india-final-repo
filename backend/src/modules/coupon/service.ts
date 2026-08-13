import { Prisma, CouponType } from "../../generated/prisma/client";

import * as repository from "./repository";

import {
  BadRequestException,
} from "../../exceptions/BadRequestException";

import {
  NotFoundException,
} from "../../exceptions/NotFoundException";

import type {
  CreateCouponInput,
  UpdateCouponInput,
  ApplyCouponInput,
} from "./schema";

import type {
  ApplyCouponResult,
} from "./types";
import { couponApplicationsTotal, couponRedemptionsTotal } from "../metrics";

const rejectCoupon = (message: string): never => {
  couponApplicationsTotal.inc({ result: "rejected" });
  throw new BadRequestException(message);
};

export async function create(
  data: CreateCouponInput
) {
  const existing = await repository.findByCode(data.code);

  if (existing) {
    throw new BadRequestException(
      "Coupon already exists"
    );
  }

  return repository.create(data);
}

export function findAll() {
  return repository.findAll();
}

export async function findById(id: string) {
  const coupon = await repository.findById(id);

  if (!coupon) {
    throw new NotFoundException("Coupon not found");
  }

  return coupon;
}

export async function update(
  id: string,
  data: UpdateCouponInput
) {
  await findById(id);

  return repository.update(id, data);
}

export async function remove(id: string) {
  await findById(id);

  return repository.remove(id);
}

export async function applyCoupon(
  userId: string,
  data: ApplyCouponInput
): Promise<ApplyCouponResult> {
  couponApplicationsTotal.inc({ result: "attempted" });
  const coupon = await repository.findByCode(data.code);

  if (!coupon) {
    couponApplicationsTotal.inc({ result: "not_found" });
    throw new NotFoundException("Coupon not found");
  }

  if (!coupon.isActive) {
    rejectCoupon("Coupon is inactive");
  }

  const now = new Date();

  if (coupon.startsAt && now < coupon.startsAt) {
    rejectCoupon("Coupon is not active yet");
  }

  if (coupon.expiresAt && now > coupon.expiresAt) {
    rejectCoupon("Coupon has expired");
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    rejectCoupon("Coupon usage limit reached");
  }

  if (
    coupon.minimumOrderAmount &&
    data.subtotal <
      Number(coupon.minimumOrderAmount)
  ) {
    rejectCoupon(`Minimum order amount is ₹${coupon.minimumOrderAmount}`);
  }

  const alreadyUsed =
    await repository.hasUserUsedCoupon(
      coupon.id,
      userId
    );

  if (alreadyUsed) {
    rejectCoupon("Coupon already used");
  }

  let discount = 0;

  if (
    coupon.type === CouponType.PERCENTAGE
  ) {
    discount =
      (data.subtotal *
        Number(coupon.value)) /
      100;

    if (
      coupon.maximumDiscount &&
      discount >
        Number(coupon.maximumDiscount)
    ) {
      discount = Number(
        coupon.maximumDiscount
      );
    }
  } else {
    discount = Number(coupon.value);
  }

  if (discount > data.subtotal) {
    discount = data.subtotal;
  }

  couponApplicationsTotal.inc({ result: "applied" });
  return {
    coupon,
    discount,
    finalAmount:
      data.subtotal - discount,
  };
}

export async function consumeCoupon(
  couponId: string,
  userId: string
) {
  await repository.createUsage(
    couponId,
    userId
  );

  await repository.incrementUsage(
    couponId
  );
  couponRedemptionsTotal.inc();
}
