import { OrderStatus, PaymentStatus, Prisma, type Payment } from "../../generated/prisma/client";
import { prisma } from "../../db/prisma";
import { BadRequestException } from "../../exceptions/BadRequestException";
import { NotFoundException } from "../../exceptions/NotFoundException";
import type { CheckoutSnapshot } from "../../types/checkout";
import * as repository from "./repository";
import { orderValueRupees, ordersCreated } from "../metrics";

function snapshotFor(payment: Payment): CheckoutSnapshot {
  if (!payment.metadata || typeof payment.metadata !== "object" || Array.isArray(payment.metadata)) {
    throw new BadRequestException("Payment does not contain a checkout snapshot");
  }
  return payment.metadata as unknown as CheckoutSnapshot;
}

/** Creates the order exactly once after a payment has been verified. */
export async function createFromPayment(payment: Payment) {
  const snapshot = snapshotFor(payment);

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findFirst({ where: { paymentId: payment.id }, include: { items: true } });
    if (existing) return { order: existing, created: false };

    // Conditional updates prevent overselling when two checkouts race for the last unit.
    for (const item of snapshot.items) {
      const updated = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity }, status: "ACTIVE" },
        data: { stock: { decrement: item.quantity } },
      });
      if (updated.count !== 1) throw new BadRequestException(`${item.name} is no longer available`);
    }

    const order = await tx.order.create({
      data: {
        orderNumber: `ORD-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`,
        userId: payment.userId,
        paymentId: payment.id,
        razorpayOrderId: payment.providerOrderId,
        paymentStatus: PaymentStatus.PAID,
        subtotal: new Prisma.Decimal(snapshot.subtotal),
        discount: new Prisma.Decimal(snapshot.discount),
        shippingCharge: new Prisma.Decimal(snapshot.shipping),
        tax: new Prisma.Decimal(snapshot.tax),
        total: new Prisma.Decimal(snapshot.total),
        fullName: snapshot.address.fullName,
        phone: snapshot.address.phone,
        addressLine1: snapshot.address.addressLine1,
        addressLine2: snapshot.address.addressLine2,
        city: snapshot.address.city,
        state: snapshot.address.state,
        country: snapshot.address.country,
        postalCode: snapshot.address.postalCode,
        items: { create: snapshot.items.map((item) => ({ productId: item.productId, productName: item.name, quantity: item.quantity, price: new Prisma.Decimal(item.unitPrice) })) },
      },
      include: { items: true },
    });
    await tx.cartItem.deleteMany({ where: { cart: { userId: payment.userId } } });
    return { order, created: true };
  });
  if (result.created) {
    ordersCreated.inc();
    orderValueRupees.observe(Number(snapshot.total));
  }
  return result.order;
}

export function getOrders(userId: string) {
  return repository.findManyByUser(userId);
}

export async function getOrderById(id: string, userId: string) {
  const order = await repository.findByIdForUser(id, userId);
  if (!order) throw new NotFoundException("Order not found");
  return order;
}

export async function cancelOrder(id: string, userId: string) {
  const order = await getOrderById(id, userId);
  if (order.status !== OrderStatus.PENDING) {
    throw new BadRequestException("Only pending orders can be cancelled");
  }
  if (order.paymentStatus === PaymentStatus.PAID) {
    throw new BadRequestException("Paid orders must be cancelled through the refund workflow");
  }
  return repository.cancel(order.id);
}
