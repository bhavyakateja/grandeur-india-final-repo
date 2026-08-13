import { prisma } from "../../db/prisma";
import { Prisma } from "../../generated/prisma/client";

const addressInclude = {} satisfies Prisma.AddressInclude;

export async function create(data: Prisma.AddressCreateInput) {
  return prisma.address.create({
    data,
    include: addressInclude,
  });
}

export async function findById(id: string) {
  return prisma.address.findUnique({
    where: { id },
    include: addressInclude,
  });
}

export async function findByUserId(userId: string) {
  return prisma.address.findMany({
    where: {
      userId,
    },
    orderBy: [
      {
        isDefault: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    include: addressInclude,
  });
}

export async function clearDefault(userId: string) {
  return prisma.address.updateMany({
    where: {
      userId,
      isDefault: true,
    },
    data: {
      isDefault: false,
    },
  });
}

export async function update(
  id: string,
  data: Prisma.AddressUpdateInput
) {
  return prisma.address.update({
    where: {
      id,
    },
    data,
    include: addressInclude,
  });
}

export async function remove(id: string) {
  return prisma.address.delete({
    where: {
      id,
    },
  });
}