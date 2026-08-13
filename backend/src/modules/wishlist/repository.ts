import { prisma } from "../../db/prisma";
import { Prisma } from "../../generated/prisma/client";

const wishlistInclude = {
  product: {
    include: {
      category: true,
      images: true,
    },
  },
} satisfies Prisma.WishlistInclude;

export async function findByUserId(userId: string) {
  return prisma.wishlist.findMany({
    where: {
      userId,
    },
    include: wishlistInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function findItem(
  userId: string,
  productId: string
) {
  return prisma.wishlist.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
    include: wishlistInclude,
  });
}

export async function create(
  data: Prisma.WishlistCreateInput
) {
  return prisma.wishlist.create({
    data,
    include: wishlistInclude,
  });
}

export async function remove(id: string) {
  return prisma.wishlist.delete({
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