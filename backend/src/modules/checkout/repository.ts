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
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              status: true,
            },
          },
        },
      },
    },
  });
}

export async function findAddress(
  userId: string,
  addressId: string,
) {
  return prisma.address.findFirst({
    where: {
      id: addressId,
      userId,
    },
    select: {
      id: true,
      fullName: true,
      phone: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      country: true,
      postalCode: true,
    },
  });
}