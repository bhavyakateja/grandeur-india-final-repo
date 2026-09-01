import crypto from "node:crypto";

import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  type Payment,
} from "../../generated/prisma/client";

import { prisma } from "../../db/prisma";

import { BadRequestException } from "../../exceptions/BadRequestException";
import { NotFoundException } from "../../exceptions/NotFoundException";

import type {
  CheckoutSnapshot,
  CheckoutSnapshotItem,
} from "../../types/checkout";

import * as repository from "./repository";

/**
 * Convert the payment metadata into the immutable
 * checkout snapshot used to create the order.
 *
 * The snapshot contains the exact:
 *
 * - products
 * - quantities
 * - prices
 * - discount
 * - shipping
 * - tax
 * - total
 * - delivery address
 *
 * that were used during checkout.
 */
function snapshotFor(
  payment: Payment,
): CheckoutSnapshot {
  if (
    !payment.metadata ||
    typeof payment.metadata !== "object" ||
    Array.isArray(payment.metadata)
  ) {
    throw new BadRequestException(
      "Payment does not contain a checkout snapshot",
    );
  }

  return payment.metadata as unknown as CheckoutSnapshot;
}

/**
 * Create an order exactly once after payment
 * has successfully become PAID.
 *
 * This operation is transactional.
 *
 * 1. Check idempotency.
 * 2. Atomically decrement stock.
 * 3. Create order.
 * 4. Create order items.
 * 5. Clear cart.
 *
 * If any step fails, the entire transaction rolls back.
 */
export async function createFromPayment(
  payment: Payment,
) {
  if (payment.status !== PaymentStatus.PAID) {
    throw new BadRequestException(
      "Only paid payments can create orders",
    );
  }

  const snapshot = snapshotFor(payment);

  const result = await prisma.$transaction(
    async (tx) => {
      /**
       * Idempotency protection.
       *
       * Payment is unique per order, so a payment
       * can only produce one order.
       */
      const existing = await tx.order.findFirst({
        where: {
          paymentId: payment.id,
        },
        include: {
          items: true,
        },
      });

      if (existing) {
        return {
          order: existing,
          created: false,
        };
      }

      /**
       * Atomically decrement stock.
       *
       * updateMany + stock >= quantity ensures
       * concurrent requests cannot oversell stock.
       */
      for (const item of snapshot.items) {
        const updated =
          await tx.product.updateMany({
            where: {
              id: item.productId,
              status: "ACTIVE",
              stock: {
                gte: item.quantity,
              },
            },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

        if (updated.count !== 1) {
          throw new BadRequestException(
            `${item.name} is no longer available`,
          );
        }
      }

      /**
       * Create the order from the immutable
       * checkout snapshot.
       */
      const order = await tx.order.create({
        data: {
          orderNumber:
            `ORD-${crypto
              .randomUUID()
              .replace(/-/g, "")
              .slice(0, 16)
              .toUpperCase()}`,

          userId: payment.userId,

          paymentId: payment.id,

          paymentStatus:
            PaymentStatus.PAID,

          subtotal:
            new Prisma.Decimal(
              snapshot.subtotal,
            ),

          discount:
            new Prisma.Decimal(
              snapshot.discount,
            ),

          shippingCharge:
            new Prisma.Decimal(
              snapshot.shipping,
            ),

          tax:
            new Prisma.Decimal(
              snapshot.tax,
            ),

          total:
            new Prisma.Decimal(
              snapshot.total,
            ),

          /**
           * Store a snapshot of the delivery
           * address on the order.
           *
           * Future address edits must not alter
           * historical orders.
           */
          fullName:
            snapshot.address.fullName,

          phone:
            snapshot.address.phone,

          addressLine1:
            snapshot.address.addressLine1,

          addressLine2:
            snapshot.address.addressLine2,

          city:
            snapshot.address.city,

          state:
            snapshot.address.state,

          country:
            snapshot.address.country,

          postalCode:
            snapshot.address.postalCode,

          items: {
            create:
              snapshot.items.map(
                (item: CheckoutSnapshotItem) => ({
                  productId:
                    item.productId,

                  productName:
                    item.name,

                  quantity:
                    item.quantity,

                  price:
                    new Prisma.Decimal(
                      item.unitPrice,
                    ),
                }),
              ),
          },
        },

        include: {
          items: true,
        },
      });

      /**
       * The order now exists successfully.
       * Clear the customer's cart.
       */
      await tx.cartItem.deleteMany({
        where: {
          cart: {
            userId: payment.userId,
          },
        },
      });

      return {
        order,
        created: true,
      };
    },
  );

  // Invalidate product caches for all items whose stock was decremented.
  if (result.created) {
    const snapshot = snapshotFor(payment);
    const { cache, CacheKeys } = await import("../redis");

    await Promise.all([
      ...snapshot.items.map((item) =>
        cache.remove(CacheKeys.product(item.productId)),
      ),
      cache.clearPattern("products:*"),
    ]);
  }

  return result;
}

/**
 * Get all orders belonging to the
 * authenticated customer.
 */
export function getOrders(
  userId: string,
) {
  return repository.findManyByUser(
    userId,
  );
}

/**
 * Get one order belonging to the
 * authenticated customer.
 */
export async function getOrderById(
  id: string,
  userId: string,
) {
  const order =
    await repository.findByIdForUser(
      id,
      userId,
    );

  if (!order) {
    throw new NotFoundException(
      "Order not found",
    );
  }

  return order;
}

/**
 * Cancel an unpaid pending order.
 *
 * Paid orders must go through the refund
 * workflow instead.
 */
export async function cancelOrder(
  id: string,
  userId: string,
) {
  const order =
    await getOrderById(
      id,
      userId,
    );

  if (
    order.status !==
    OrderStatus.PENDING
  ) {
    throw new BadRequestException(
      "Only pending orders can be cancelled",
    );
  }

  if (
    order.paymentStatus ===
    PaymentStatus.PAID
  ) {
    throw new BadRequestException(
      "Paid orders must be cancelled through the refund workflow",
    );
  }

  return repository.cancel(
    order.id,
  );
}
