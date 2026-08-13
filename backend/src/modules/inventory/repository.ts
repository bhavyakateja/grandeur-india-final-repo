import { prisma } from "../../db/prisma";

export function findProduct(productId: string) {
  return prisma.product.findUnique({
    where: {
      id: productId,
    },
  });
}

export function updateStock(
  productId: string,
  quantity: number
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

export function incrementStock(
  productId: string,
  quantity: number
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

export function decrementStock(
  productId: string,
  quantity: number
) {
  return prisma.product.update({
    where: {
      id: productId,
    },
    data: {
      stock: {
        decrement: quantity,
      },
    },
  });
}

export async function reserveStock(
    productId: string,
    quantity: number
) {
    return prisma.$transaction(async (tx) => {

        const product = await tx.product.findUnique({
            where: {
                id: productId
            }
        });

        if (!product) {
            throw new Error("Product not found");
        }

        if (product.stock < quantity) {
            throw new Error("Insufficient stock");
        }

        return tx.product.update({
            where: {
                id: productId
            },
            data: {
                stock: {
                    decrement: quantity
                }
            }
        });

    });
}

export function releaseStock(
    productId: string,
    quantity: number
) {
    return prisma.product.update({
        where: {
            id: productId
        },
        data: {
            stock: {
                increment: quantity
            }
        }
    });
}