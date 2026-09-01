import { prisma } from "../../src/db/prisma";
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
} from "../../src/generated/prisma/client";

export async function createOrder(
  userId: string,
  productId: string
) {
  const payment = await prisma.payment.create({
    data: {
      userId,
      provider: "RAZORPAY",
      providerOrderId: `order_test_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`,
      amount: new Prisma.Decimal(1180),
      currency: "INR",
      status: PaymentStatus.PENDING,
    },
  });

  return prisma.order.create({
    data: {
      orderNumber: `ORD-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,

      userId,

      paymentId: payment.id,

      paymentStatus: PaymentStatus.PENDING,

      status: OrderStatus.PENDING,

      subtotal: new Prisma.Decimal(1000),
      discount: new Prisma.Decimal(0),
      shippingCharge: new Prisma.Decimal(0),
      tax: new Prisma.Decimal(180),
      total: new Prisma.Decimal(1180),

      fullName: "Bhavya Kateja",
      phone: "9876543210",
      addressLine1: "123 Test Street",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      postalCode: "560001",

      items: {
        create: [
          {
            productId,
            productName: "MacBook Pro",
            quantity: 1,
            price: new Prisma.Decimal(1000),
          },
        ],
      },
    },
    include: {
      items: true,
    },
  });
}