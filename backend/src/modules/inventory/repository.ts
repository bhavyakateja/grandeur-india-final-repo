import { prisma } from "../../db/prisma";

export function findProduct(productId: string) {
  return prisma.product.findUnique({
    where: {
      id: productId,
    },
    select: {
      id: true,
      stock: true,
      status: true,
    },
  });
}

export async function updateStock(
  productId: string,
  quantity: number,
) {
  return prisma.product.update({
    where: {
      id: productId,
    },
    data: {
      stock: quantity,
    },
  });
}

/**
 * Atomically reserves stock.
 *
 * The WHERE condition prevents two concurrent requests
 * from reducing stock below zero.
 */
export async function reserveStock(
  productId: string,
  quantity: number,
) {
  const result = await prisma.product.updateMany({
    where: {
      id: productId,
      stock: {
        gte: quantity,
      },
    },
    data: {
      stock: {
        decrement: quantity,
      },
    },
  });

  return result.count;
}

export function releaseStock(
  productId: string,
  quantity: number,
) {
  return prisma.product.update({
    where: {
      id: productId,
    },
    data: {
      stock: {
        increment: quantity,
      },
    },
  });
}