import * as repository from "./repository";

import { Prisma, ProductStatus } from "../../generated/prisma/client";

import { NotFoundException } from "../../exceptions/NotFoundException";
import { BadRequestException } from "../../exceptions/BadRequestException";

import { calculatePricing } from "../../shared/pricing";

import * as couponService from "../coupon/service";

import type {
  CheckoutInput,
} from "./schema";

import type {
  CheckoutItem,
  CheckoutResponse,
} from "./types";

export async function checkout(
  userId: string,
  data: CheckoutInput
): Promise<CheckoutResponse> {
  const address = await repository.findAddress(
    userId,
    data.addressId
  );

  if (!address) {
    throw new NotFoundException("Address not found");
  }

  const cart = await repository.findCart(userId);

  if (!cart || cart.items.length === 0) {
    throw new BadRequestException("Cart is empty");
  }

  const items: CheckoutItem[] = [];

  let subtotal = new Prisma.Decimal(0);

  for (const item of cart.items) {
    const product = item.product;

    if (product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException(
        `${product.name} is unavailable`
      );
    }

    if (item.quantity > product.stock) {
      throw new BadRequestException(
        `${product.name} has only ${product.stock} left in stock`
      );
    }

    const total = item.priceAtAddition.mul(
      item.quantity
    );

    subtotal = subtotal.plus(total);

    items.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPrice: item.priceAtAddition,
      total,
    });
  }

  // Coupon (Phase 2)
  let discount = new Prisma.Decimal(0);

  if (data.couponCode) {
    const applied = await couponService.applyCoupon(userId, {
      code: data.couponCode,
      subtotal: Number(subtotal),
    });

    discount = new Prisma.Decimal(applied.discount);
  }

  // Shipping (Phase 2)
  const shipping = new Prisma.Decimal(0);

  // GST (18%)
  const tax = subtotal.mul(0.18);

  const pricing = calculatePricing({
    subtotal,
    discount,
    shipping,
    tax,
  });

  return {
    addressId: data.addressId,
    couponCode: data.couponCode,
    items,
    subtotal: pricing.subtotal,
    discount: pricing.discount,
    shipping: pricing.shipping,
    tax: pricing.tax,
    total: pricing.total,
  };
}