import { prisma } from "../../db/prisma";
import { Prisma } from "../../generated/prisma/client";

import type {
  CreateCouponInput,
  UpdateCouponInput,
} from "./schema";

export function create(data: CreateCouponInput) {
  return prisma.coupon.create({
    data: {
      code: data.code,
      description: data.description,
      type: data.type,
      value: new Prisma.Decimal(data.value),

      minimumOrderAmount:
        data.minimumOrderAmount !== undefined &&
        data.minimumOrderAmount !== null
          ? new Prisma.Decimal(data.minimumOrderAmount)
          : undefined,

      maximumDiscount:
        data.maximumDiscount !== undefined &&
        data.maximumDiscount !== null
          ? new Prisma.Decimal(data.maximumDiscount)
          : undefined,

      usageLimit: data.usageLimit,
      startsAt: data.startsAt,
      expiresAt: data.expiresAt,
      isActive: data.isActive,
    },
  });
}

export function findAll() {
  return prisma.coupon.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export function findById(id: string) {
  return prisma.coupon.findUnique({
    where: { id },
  });
}

export function findByCode(code: string) {
  return prisma.coupon.findUnique({
    where: { code },
  });
}

export function update(
  id: string,
  data: UpdateCouponInput,
) {
  return prisma.coupon.update({
    where: { id },
    data: {
      ...(data.code !== undefined && {
        code: data.code,
      }),

      ...(data.description !== undefined && {
        description: data.description,
      }),

      ...(data.type !== undefined && {
        type: data.type,
      }),

      ...(data.value !== undefined && {
        value: new Prisma.Decimal(data.value),
      }),

      ...(data.minimumOrderAmount !== undefined && {
        minimumOrderAmount:
          data.minimumOrderAmount === null
            ? null
            : new Prisma.Decimal(
                data.minimumOrderAmount,
              ),
      }),

      ...(data.maximumDiscount !== undefined && {
        maximumDiscount:
          data.maximumDiscount === null
            ? null
            : new Prisma.Decimal(
                data.maximumDiscount,
              ),
      }),

      ...(data.usageLimit !== undefined && {
        usageLimit: data.usageLimit,
      }),

      ...(data.startsAt !== undefined && {
        startsAt: data.startsAt,
      }),

      ...(data.expiresAt !== undefined && {
        expiresAt: data.expiresAt,
      }),

      ...(data.isActive !== undefined && {
        isActive: data.isActive,
      }),
    },
  });
}

export function deactivate(id: string) {
  return prisma.coupon.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
}

export function hasUserUsedCoupon(
  couponId: string,
  userId: string,
) {
  return prisma.couponUsage.findUnique({
    where: {
      couponId_userId: {
        couponId,
        userId,
      },
    },
  });
}

export async function consumeCoupon(
  couponId: string,
  userId: string,
) {
  return prisma.$transaction(async (tx) => {
    const coupon = await tx.coupon.findUnique({
      where: { id: couponId },
    });

    if (!coupon) {
      throw new Error("Coupon not found");
    }

    const existing = await tx.couponUsage.findUnique({
      where: {
        couponId_userId: {
          couponId,
          userId,
        },
      },
    });

    if (existing) {
      throw new Error("Coupon has already been used");
    }

    if (
      coupon.usageLimit !== null &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      throw new Error("Coupon usage limit reached");
    }

    const usage = await tx.couponUsage.create({
      data: {
        couponId,
        userId,
      },
    });

    await tx.coupon.update({
      where: { id: couponId },
      data: {
        usedCount: {
          increment: 1,
        },
      },
    });

    return usage;
  });
}