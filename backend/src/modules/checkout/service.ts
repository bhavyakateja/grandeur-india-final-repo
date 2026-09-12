import { Prisma, ProductStatus } from "../../generated/prisma/client";

import * as repository from "./repository";
import * as couponService from "../coupon/service";
import * as settingsService from "../settings/service";
import * as shippingService from "../shipping/service";

import { NotFoundException } from "../../exceptions/NotFoundException";
import { BadRequestException } from "../../exceptions/BadRequestException";

import { calculatePricing } from "../../shared/pricing";

import type { CheckoutInput } from "./schema";
import type {
  CheckoutItem,
  CheckoutResponse,
} from "./types";

export async function checkout(
  userId: string,
  data: CheckoutInput,
): Promise<CheckoutResponse> {
  const [address, cart, settings] = await Promise.all([
    repository.findAddress(
      userId,
      data.addressId,
    ),
    repository.findCart(userId),
    settingsService.getSettings(),
  ]);

  if (!address) {
    throw new NotFoundException(
      "Address not found",
    );
  }

  if (!cart || cart.items.length === 0) {
    throw new BadRequestException(
      "Cart is empty",
    );
  }

  if (!settings.storeEnabled) {
    throw new BadRequestException(
      "Store is currently unavailable",
    );
  }

  const isInternational = address.country.trim().toLowerCase() !== "india";

  if (isInternational && !settings.internationalShippingEnabled) {
    throw new BadRequestException(
      "International shipping is currently not enabled. Orders can only be placed for delivery within India.",
    );
  }

  const items: CheckoutItem[] = [];
  let subtotal = new Prisma.Decimal(0);

  for (const item of cart.items) {
    const product = item.product;

    if (product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException(
        `${product.name} is unavailable`,
      );
    }

    if (item.quantity > product.stock) {
      throw new BadRequestException(
        `${product.name} has only ${product.stock} left in stock`,
      );
    }

    // Always use the current product price.
    // Cart price is not trusted for final checkout pricing.
    const unitPrice = new Prisma.Decimal(
      product.price,
    );

    const total = unitPrice.mul(
      item.quantity,
    );

    subtotal = subtotal.plus(total);

    items.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPrice,
      total,
    });
  }

  let discount = new Prisma.Decimal(0);

  if (data.couponCode) {
    const applied = await couponService.applyCoupon(
      userId,
      {
        code: data.couponCode,
        subtotal,
      },
    );

    discount = applied.discount;
  }

  /*
   * Shipping
   *
   * For India (domestic): Dynamic Blue Dart shipping rate or free over threshold.
   * For International: Admin-configured international shipping charge.
   */
  const amountAfterDiscount = subtotal.minus(
    discount,
  );

  let shipping = new Prisma.Decimal(settings.defaultShippingCharge);
  let transitDays: number | undefined;
  let estimatedDelivery: string | undefined;
  let courier: string | undefined;

  if (isInternational) {
    shipping = new Prisma.Decimal(settings.defaultShippingCharge);
  } else {
    courier = "BLUEDART";
    // Total package weight: estimated 500g for first item + 250g for additional units
    const totalUnits = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const weightGrams = 500 + Math.max(0, totalUnits - 1) * 250;

    const rateResult = await shippingService.calculateShippingRate({
      pincode: address.postalCode,
      weightGrams,
    });

    transitDays = rateResult.transitDays;
    estimatedDelivery = rateResult.estimatedDelivery;

    if (amountAfterDiscount.gte(settings.freeShippingThreshold)) {
      shipping = new Prisma.Decimal(0);
    } else {
      shipping = new Prisma.Decimal(rateResult.rate > 0 ? rateResult.rate : settings.defaultShippingCharge);
    }
  }

  /*
   * Tax
   *
   * GST rate is configured by Admin.
   *
   * Example:
   * gstRate = 18 → 18%
   */
  const tax = amountAfterDiscount
    .mul(settings.gstRate)
    .div(100);

  const pricing = calculatePricing({
    subtotal,
    discount,
    shipping,
    tax,
  });

  return {
    address,
    couponCode: data.couponCode,
    items,
    subtotal: pricing.subtotal,
    discount: pricing.discount,
    shipping: pricing.shipping,
    tax: pricing.tax,
    total: pricing.total,
    courier,
    transitDays,
    estimatedDelivery,
  };
}

/** Current-cart subtotal for customer-facing coupon previews. */
export async function getCartSubtotal(userId: string) {
  const cart = await repository.findCart(userId);
  if (!cart || cart.items.length === 0) {
    throw new BadRequestException("Cart is empty");
  }

  return cart.items.reduce(
    (subtotal, item) => subtotal.plus(
      new Prisma.Decimal(item.product.price).mul(item.quantity),
    ),
    new Prisma.Decimal(0),
  );
}
