import { prisma } from "../../db/prisma";

export function findManyByUser(userId: string) {
  return prisma.order.findMany({ where: { userId }, include: { items: true }, orderBy: { createdAt: "desc" } });
}

export function findByIdForUser(id: string, userId: string) {
  return prisma.order.findFirst({ where: { id, userId }, include: { items: true } });
}

export function findForInvoice(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      user: { select: { email: true } },
    },
  });
}

export function cancel(id: string) {
  return prisma.order.update({ where: { id }, data: { status: "CANCELLED" } });
}
