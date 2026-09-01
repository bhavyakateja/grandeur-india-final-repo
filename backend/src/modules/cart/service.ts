import {
  Prisma,
  ProductStatus,
} from "../../generated/prisma/client";

import * as repository from "./repository";

import { NotFoundException } from "../../exceptions/NotFoundException";
import { BadRequestException } from "../../exceptions/BadRequestException";

import { cache, CacheKeys } from "../redis";

import type {
  AddToCartInput,
  UpdateCartItemInput,
} from "./schema";

async function invalidateCart(
  userId: string,
) {
  await cache.remove(
    CacheKeys.cart(userId),
  );
}

export async function addToCart(
  userId: string,
  data: AddToCartInput,
) {
  const product =
    await repository.getProduct(
      data.productId,
    );

  if (!product) {
    throw new NotFoundException(
      "Product not found",
    );
  }

  if (
    product.status !==
    ProductStatus.ACTIVE
  ) {
    throw new BadRequestException(
      "Product is not available",
    );
  }

  if (product.stock <= 0) {
    throw new BadRequestException(
      "Product is out of stock",
    );
  }

  if (data.quantity > product.stock) {
    throw new BadRequestException(
      "Insufficient stock",
    );
  }

  let cart =
    await repository.findByUserId(
      userId,
    );

  if (!cart) {
    cart =
      await repository.create(userId);
  }

  const existingItem =
    await repository.findItem(
      cart.id,
      data.productId,
    );

  if (existingItem) {
    const newQuantity =
      existingItem.quantity +
      data.quantity;

    if (
      newQuantity > product.stock
    ) {
      throw new BadRequestException(
        "Insufficient stock",
      );
    }

    const updated =
      await repository.updateItem(
        existingItem.id,
        {
          quantity: newQuantity,
        },
      );

    await invalidateCart(userId);

    return updated;
  }

  const created =
    await repository.createItem({
      quantity: data.quantity,
      priceAtAddition:
        new Prisma.Decimal(
          product.price,
        ),
      cart: {
        connect: {
          id: cart.id,
        },
      },
      product: {
        connect: {
          id: product.id,
        },
      },
    });

  await invalidateCart(userId);

  return created;
}

export async function getCart(
  userId: string,
) {
  let cart =
    await repository.findByUserId(
      userId,
    );

  if (!cart) {
    cart =
      await repository.create(userId);
  }

  return cart;
}

export async function updateItem(
  itemId: string,
  userId: string,
  data: UpdateCartItemInput,
) {
  const item =
    await repository.findItemById(
      itemId,
    );

  if (
    !item ||
    item.cart.userId !== userId
  ) {
    throw new NotFoundException(
      "Cart item not found",
    );
  }

  if (
    item.product.status !==
    ProductStatus.ACTIVE
  ) {
    throw new BadRequestException(
      "Product is no longer available",
    );
  }

  if (
    data.quantity >
    item.product.stock
  ) {
    throw new BadRequestException(
      "Insufficient stock",
    );
  }

  const updated =
    await repository.updateItem(
      itemId,
      {
        quantity: data.quantity,
      },
    );

  await invalidateCart(userId);

  return updated;
}

export async function removeItem(
  itemId: string,
  userId: string,
) {
  const item =
    await repository.findItemById(
      itemId,
    );

  if (
    !item ||
    item.cart.userId !== userId
  ) {
    throw new NotFoundException(
      "Cart item not found",
    );
  }

  await repository.deleteItem(
    itemId,
  );

  await invalidateCart(userId);
}