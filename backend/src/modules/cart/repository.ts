import { prisma } from "../../db/prisma";
import { Prisma } from "../../generated/prisma/client";

const cartInclude = {
  items: {
    include: {
      product: {
        include: {
          images: true,
          category: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  },
} satisfies Prisma.CartInclude;

export async function findByUserId(userId: string) {
  return prisma.cart.findUnique({
    where: {
      userId,
    },
    include: cartInclude,
  });
}

export async function create(userId: string) {
  return prisma.cart.create({
    data: {
      user: {
        connect: {
          id: userId,
        },
      },
    },
    include: cartInclude,
  });
}

export async function findItem(
  cartId: string,
  productId: string
) {
  return prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId,
        productId,
      },
    },
  });
}

export async function createItem(
  data: Prisma.CartItemCreateInput
) {
  return prisma.cartItem.create({
    data,
  });
}

export async function updateItem(
  id: string,
  data: Prisma.CartItemUpdateInput
) {
  return prisma.cartItem.update({
    where: {
      id,
    },
    data,
  });
}

export async function findItemById(id: string) {
  return prisma.cartItem.findUnique({
    where: {
      id,
    },
    include: {
      cart: true,
      product: true,
    },
  });
}

export async function deleteItem(id: string) {
  return prisma.cartItem.delete({
    where: {
      id,
    },
  });
}

export async function getProduct(productId: string) {
  return prisma.product.findUnique({
    where: {
      id: productId,
    },
  });
}