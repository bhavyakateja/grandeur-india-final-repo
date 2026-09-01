import { prisma } from "../../db/prisma";
import type { Prisma } from "../../generated/prisma/client";

export async function create(
  data: Prisma.AddressCreateInput,
) {
  return prisma.address.create({
    data,
  });
}

export async function findById(id: string) {
  return prisma.address.findUnique({
    where: { id },
  });
}

export async function findByUserId(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [
      { isDefault: "desc" },
      { createdAt: "desc" },
    ],
  });
}

export async function countByUserId(userId: string) {
  return prisma.address.count({
    where: { userId },
  });
}

export async function clearDefault(
  userId: string,
) {
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
  data: Prisma.AddressUpdateInput,
) {
  return prisma.address.update({
    where: { id },
    data,
  });
}

export async function remove(id: string) {
  return prisma.address.delete({
    where: { id },
  });
}

export async function findReplacementDefault(
  userId: string,
  excludedId: string,
) {
  return prisma.address.findFirst({
    where: {
      userId,
      id: { not: excludedId },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function setDefault(id: string) {
  return prisma.address.update({
    where: { id },
    data: {
      isDefault: true,
    },
  });
}