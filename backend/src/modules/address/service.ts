import * as repository from "./repository";

import { Prisma } from "../../generated/prisma/client";
import { NotFoundException } from "../../exceptions/NotFoundException";

import type {
  CreateAddressInput,
  UpdateAddressInput,
} from "./schema";

export async function create(
  userId: string,
  data: CreateAddressInput
) {
  if (data.isDefault) {
    await repository.clearDefault(userId);
  }

  return repository.create({
    fullName: data.fullName,
    phone: data.phone,
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2,
    city: data.city,
    state: data.state,
    country: data.country,
    postalCode: data.postalCode,
    isDefault: data.isDefault,
    user: {
      connect: {
        id: userId,
      },
    },
  });
}

export async function getAll(userId: string) {
  return repository.findByUserId(userId);
}

export async function update(
  id: string,
  userId: string,
  data: UpdateAddressInput
) {
  const address = await repository.findById(id);

  if (!address || address.userId !== userId) {
    throw new NotFoundException("Address not found");
  }

  if (data.isDefault) {
    await repository.clearDefault(userId);
  }

  const updateData: Prisma.AddressUpdateInput = {};

  if (data.fullName !== undefined)
    updateData.fullName = data.fullName;

  if (data.phone !== undefined)
    updateData.phone = data.phone;

  if (data.addressLine1 !== undefined)
    updateData.addressLine1 = data.addressLine1;

  if (data.addressLine2 !== undefined)
    updateData.addressLine2 = data.addressLine2;

  if (data.city !== undefined)
    updateData.city = data.city;

  if (data.state !== undefined)
    updateData.state = data.state;

  if (data.country !== undefined)
    updateData.country = data.country;

  if (data.postalCode !== undefined)
    updateData.postalCode = data.postalCode;

  if (data.isDefault !== undefined)
    updateData.isDefault = data.isDefault;

  return repository.update(id, updateData);
}

export async function remove(
  id: string,
  userId: string
) {
  const address = await repository.findById(id);

  if (!address || address.userId !== userId) {
    throw new NotFoundException("Address not found");
  }

  await repository.remove(id);
}