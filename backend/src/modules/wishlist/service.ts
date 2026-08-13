import * as repository from "./repository";

import { ProductStatus } from "../../generated/prisma/client";

import { NotFoundException } from "../../exceptions/NotFoundException";
import { BadRequestException } from "../../exceptions/BadRequestException";
import { cache, CacheKeys } from "../redis";

import type { AddToWishlistInput } from "./schema";

export async function addToWishlist(
  userId: string,
  data: AddToWishlistInput
) {
  const product = await repository.getProduct(data.productId);

  if (!product) {
    throw new NotFoundException("Product not found");
  }

  if (product.status !== ProductStatus.ACTIVE) {
    throw new BadRequestException("Product is not available");
  }

  const existingItem = await repository.findItem(
    userId,
    data.productId
  );

  if (existingItem) {
    throw new BadRequestException(
      "Product already exists in wishlist"
    );
  }

  const item = await repository.create({
    user: {
      connect: {
        id: userId,
      },
    },
    product: {
      connect: {
        id: product.id,
      },
    },
  });
  await cache.remove(CacheKeys.wishlist(userId));
  return item;
}

export async function getWishlist(userId: string) {
  return repository.findByUserId(userId);
}

export async function removeFromWishlist(
  userId: string,
  productId: string
) {
  const item = await repository.findItem(
    userId,
    productId
  );

  if (!item) {
    throw new NotFoundException(
      "Wishlist item not found"
    );
  }

  await repository.remove(item.id);
  await cache.remove(CacheKeys.wishlist(userId));
}
