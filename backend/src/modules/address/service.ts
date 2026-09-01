import { prisma } from "../../db/prisma";
import * as repository from "./repository";
import { NotFoundException } from "../../exceptions/NotFoundException";
import type {
  CreateAddressInput,
  UpdateAddressInput,
} from "./schema";

export async function create(
  userId: string,
  data: CreateAddressInput,
) {
  return prisma.$transaction(async () => {
    const addressCount = await repository.countByUserId(userId);

    const isDefault =
      data.isDefault || addressCount === 0;

    if (isDefault) {
      await repository.clearDefault(userId);
    }

    return repository.create({
      fullName: data.fullName,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 ?? null,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode,
      isDefault,
      user: {
        connect: {
          id: userId,
        },
      },
    });
  });
}

export async function getAll(userId: string) {
  return repository.findByUserId(userId);
}

export async function update(
  id: string,
  userId: string,
  data: UpdateAddressInput,
) {
  const address = await repository.findById(id);

  if (!address || address.userId !== userId) {
    throw new NotFoundException("Address not found");
  }

  return prisma.$transaction(async () => {
    if (data.isDefault === true) {
      await repository.clearDefault(userId);
    }

    return repository.update(id, {
      ...(data.fullName !== undefined && {
        fullName: data.fullName,
      }),

      ...(data.phone !== undefined && {
        phone: data.phone,
      }),

      ...(data.addressLine1 !== undefined && {
        addressLine1: data.addressLine1,
      }),

      ...(data.addressLine2 !== undefined && {
        addressLine2: data.addressLine2,
      }),

      ...(data.city !== undefined && {
        city: data.city,
      }),

      ...(data.state !== undefined && {
        state: data.state,
      }),

      ...(data.country !== undefined && {
        country: data.country,
      }),

      ...(data.postalCode !== undefined && {
        postalCode: data.postalCode,
      }),

      ...(data.isDefault !== undefined && {
        isDefault: data.isDefault,
      }),
    });
  });
}

export async function remove(
  id: string,
  userId: string,
) {
  const address = await repository.findById(id);

  if (!address || address.userId !== userId) {
    throw new NotFoundException("Address not found");
  }

  return prisma.$transaction(async () => {
    await repository.remove(id);

    if (address.isDefault) {
      const replacement =
        await repository.findReplacementDefault(
          userId,
          id,
        );

      if (replacement) {
        await repository.setDefault(replacement.id);
      }
    }
  });
}