import { prisma } from "../../src/db/prisma";

import { ProductStatus } from "../../src/generated/prisma/client";

export async function createProduct(
  categoryId: string
) {
  return prisma.product.create({
    data: {
      name: "MacBook Pro",

      slug: `macbook-${crypto.randomUUID()}`,

      description:
        "MacBook Pro created for integration testing.",

      price: 100000,

      stock: 10,

      categoryId,

      status: ProductStatus.ACTIVE,
    },
  });
}