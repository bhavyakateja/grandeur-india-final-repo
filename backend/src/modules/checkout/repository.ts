import { prisma } from "../../db/prisma";

export async function findCart(userId: string) {
  return prisma.cart.findUnique({
    where: {
      userId,
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true,
              category: true,
            },
          },
        },
      },
    },
  });
}

export async function findAddress(
  userId: string,
  addressId: string
) {
  return prisma.address.findFirst({
    where: {
      id: addressId,
      userId,
    },
  });
}
