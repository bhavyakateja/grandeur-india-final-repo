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
        data.minimumOrderAmount !== undefined
          ? new Prisma.Decimal(data.minimumOrderAmount)
          : undefined,
      maximumDiscount:
        data.maximumDiscount !== undefined
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
    where: {
      id,
    },
  });
}

export function findByCode(code: string) {
  return prisma.coupon.findUnique({
    where: {
      code,
    },
  });
}

export function update(
  id: string,
  data: UpdateCouponInput
) {
  return prisma.coupon.update({
    where: {
      id,
    },
    data: {
      ...(data.code && { code: data.code }),
      ...(data.description !== undefined && {
        description: data.description,
      }),
      ...(data.type && { type: data.type }),
      ...(data.value !== undefined && {
        value: new Prisma.Decimal(data.value),
      }),
      ...(data.minimumOrderAmount !== undefined && {
        minimumOrderAmount: new Prisma.Decimal(
          data.minimumOrderAmount
        ),
      }),
      ...(data.maximumDiscount !== undefined && {
        maximumDiscount: new Prisma.Decimal(
          data.maximumDiscount
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

export function remove(id: string) {
  return prisma.coupon.delete({
    where: {
      id,
    },
  });
}

export function incrementUsage(couponId: string) {
  return prisma.coupon.update({
    where: {
      id: couponId,
    },
    data: {
      usedCount: {
        increment: 1,
      },
    },
  });
}

export function createUsage(
  couponId: string,
  userId: string
) {
  return prisma.couponUsage.create({
    data: {
      couponId,
      userId,
    },
  });
}

export function hasUserUsedCoupon(
  couponId: string,
  userId: string
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