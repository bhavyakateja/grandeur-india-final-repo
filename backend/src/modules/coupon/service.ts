import {
  CouponType,
  Prisma,
} from "../../generated/prisma/client";

import * as repository from "./repository";

import {
  BadRequestException,
} from "../../exceptions/BadRequestException";

import {
  NotFoundException,
} from "../../exceptions/NotFoundException";

import type { CreateCouponInput, UpdateCouponInput } from "./schema";

import type {
  ApplyCouponResult,
} from "./types";

export async function create(
  data: CreateCouponInput,
) {
  const existing =
    await repository.findByCode(
      data.code,
    );

  if (existing) {
    throw new BadRequestException(
      "Coupon already exists",
    );
  }

  return repository.create(data);
}

export function findAll() {
  return repository.findAll();
}

export async function findById(
  id: string,
) {
  const coupon =
    await repository.findById(id);

  if (!coupon) {
    throw new NotFoundException(
      "Coupon not found",
    );
  }

  return coupon;
}

export async function update(
  id: string,
  data: UpdateCouponInput,
) {
  await findById(id);

  if (data.code) {
    const existing =
      await repository.findByCode(
        data.code,
      );

    if (
      existing &&
      existing.id !== id
    ) {
      throw new BadRequestException(
        "Coupon code already exists",
      );
    }
  }

  return repository.update(
    id,
    data,
  );
}

export async function remove(
  id: string,
) {
  await findById(id);

  return repository.deactivate(id);
}

export async function applyCoupon(
  userId: string,
  data: { code: string; subtotal: Prisma.Decimal },
): Promise<ApplyCouponResult> {
  const coupon =
    await repository.findByCode(
      data.code,
    );

  if (!coupon) {
    throw new NotFoundException(
      "Coupon not found",
    );
  }

  if (!coupon.isActive) {
    throw new BadRequestException(
      "Coupon is inactive",
    );
  }

  const now = new Date();

  if (
    coupon.startsAt &&
    now < coupon.startsAt
  ) {
    throw new BadRequestException(
      "Coupon is not active yet",
    );
  }

  if (
    coupon.expiresAt &&
    now > coupon.expiresAt
  ) {
    throw new BadRequestException(
      "Coupon has expired",
    );
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usedCount >=
      coupon.usageLimit
  ) {
    throw new BadRequestException(
      "Coupon usage limit reached",
    );
  }

  if (
    coupon.minimumOrderAmount !==
      null &&
    coupon.minimumOrderAmount !==
      undefined &&
    data.subtotal.lt(coupon.minimumOrderAmount)
  ) {
    throw new BadRequestException(
      "Minimum order amount requirement not met",
    );
  }

  const alreadyUsed =
    await repository.hasUserUsedCoupon(
      coupon.id,
      userId,
    );

  if (alreadyUsed) {
    throw new BadRequestException(
      "Coupon already used",
    );
  }

  let discount = new Prisma.Decimal(0);

  if (
    coupon.type ===
    CouponType.PERCENTAGE
  ) {
    discount = data.subtotal.mul(coupon.value).div(100);

    if (
      coupon.maximumDiscount !==
        null &&
      coupon.maximumDiscount !==
        undefined &&
      discount.gt(coupon.maximumDiscount)
    ) {
      discount = new Prisma.Decimal(coupon.maximumDiscount);
    }
  } else {
    discount = new Prisma.Decimal(coupon.value);
  }

  if (discount.gt(data.subtotal)) {
    discount = new Prisma.Decimal(data.subtotal);
  }

  return {
    coupon,
    discount,
    finalAmount:
      data.subtotal.minus(discount),
  };
}

/**
 * Call this only after the order/payment
 * has successfully completed.
 */
export async function consumeCoupon(
  couponId: string,
  userId: string,
) {
  try {
    return await repository.consumeCoupon(
      couponId,
      userId,
    );
  } catch (error) {
    if (
      error instanceof Error
    ) {
      throw new BadRequestException(
        error.message,
      );
    }

    throw error;
  }
}
