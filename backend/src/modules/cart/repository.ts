import { prisma } from "../../db/prisma";
import { Prisma } from "../../generated/prisma/client";

const cartInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          stock: true,
          status: true,
          images: {
            where: {
              isPrimary: true,
            },
            select: {
              url: true,
            },
            take: 1,
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  },
} satisfies Prisma.CartInclude;

export function findByUserId(
  userId: string,
) {
  return prisma.cart.findUnique({
    where: {
      userId,
    },
    include: cartInclude,
  });
}

export function create(userId: string) {
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

export function findItem(
  cartId: string,
  productId: string,
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

export function findItemById(
  id: string,
) {
  return prisma.cartItem.findUnique({
    where: {
      id,
    },
    include: {
      cart: {
        select: {
          id: true,
          userId: true,
        },
      },
      product: {
        select: {
          id: true,
          price: true,
          stock: true,
          status: true,
        },
      },
    },
  });
}

export function createItem(
  data: Prisma.CartItemCreateInput,
) {
  return prisma.cartItem.create({
    data,
  });
}

export function updateItem(
  id: string,
  data: Prisma.CartItemUpdateInput,
) {
  return prisma.cartItem.update({
    where: {
      id,
    },
    data,
  });
}

export function deleteItem(id: string) {
  return prisma.cartItem.delete({
    where: {
      id,
    },
  });
}

export function getProduct(
  productId: string,
) {
  return prisma.product.findUnique({
    where: {
      id: productId,
    },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      status: true,
    },
  });
}