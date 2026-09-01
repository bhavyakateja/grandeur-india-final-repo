import {
  PaymentProvider,
  Prisma,
} from "../../generated/prisma/client";

import { prisma } from "../../db/prisma";

export function create(data: {
  userId: string;
  provider: PaymentProvider;
  providerOrderId: string;
  amount: string | number;
  currency: string;
  metadata: Prisma.InputJsonValue;
}) {
  return prisma.payment.create({
    data: {
      userId: data.userId,
      provider: data.provider,
      providerOrderId: data.providerOrderId,
      amount: new Prisma.Decimal(data.amount),
      currency: data.currency,
      status: "PENDING",
      metadata: data.metadata,
    },
  });
}

export function findByProviderOrderId(
  providerOrderId: string,
) {
  return prisma.payment.findUnique({
    where: {
      providerOrderId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}

export function findForUser(
  id: string,
  userId: string,
) {
  return prisma.payment.findFirst({
    where: {
      id,
      userId,
    },
  });
}

export function findById(id: string) {
  return prisma.payment.findUnique({
    where: {
      id,
    },
  });
}

export async function markPaid(
  id: string,
  providerPaymentId: string,
) {
  // A conditional update makes concurrent verify/webhook attempts safe. Once
  // claimed, a payment's provider payment ID is immutable.
  await prisma.payment.updateMany({
    where: { id, status: "PENDING", providerPaymentId: null },
    data: { providerPaymentId, status: "PAID" },
  });

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (!payment || payment.status !== "PAID" || payment.providerPaymentId !== providerPaymentId) {
    throw new Error("Payment was already settled with a different provider payment ID");
  }

  return payment;
}

export function markFailed(id: string) {
  return prisma.payment.update({
    where: {
      id,
    },
    data: {
      status: "FAILED",
    },
  });
}
