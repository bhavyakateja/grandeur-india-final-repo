import { PaymentProvider, Prisma } from "../../generated/prisma/client";
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
      amount: data.amount,
      currency: data.currency,
      status: "PENDING",
      metadata: data.metadata,
    },
  });
}

export function findByProviderOrderId(providerOrderId: string) {
  return prisma.payment.findUnique({
    where: {
      providerOrderId,
    },
    include: { user: { select: { email: true } } },
  });
}

export function findForUser(id: string, userId: string) {
  return prisma.payment.findFirst({ where: { id, userId } });
}

export function findById(id: string) {
  return prisma.payment.findUnique({ where: { id } });
}

export function markPaid(
  id: string,
  providerPaymentId: string
) {
  return prisma.payment.update({
    where: {
      id,
    },
    data: {
      providerPaymentId,
      status: "PAID",
    },
    include: { user: { select: { email: true } } },
  });
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
