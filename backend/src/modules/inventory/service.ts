import * as repository from "./repository";

import {
  BadRequestException,
} from "../../exceptions/BadRequestException";

import {
  NotFoundException,
} from "../../exceptions/NotFoundException";

import {
  cache,
  CacheKeys,
} from "../redis";

import {
  logger,
} from "../../config/logger";

export async function validateStock(
  productId: string,
  quantity: number,
) {
  if (quantity <= 0) {
    throw new BadRequestException(
      "Quantity must be greater than zero",
    );
  }

  const product = await repository.findProduct(productId);

  if (!product) {
    throw new NotFoundException(
      "Product not found",
    );
  }

  return {
    available: product.stock >= quantity,
    availableQuantity: product.stock,
  };
}

export async function reserveStock(
  productId: string,
  quantity: number,
) {
  if (quantity <= 0) {
    throw new BadRequestException(
      "Quantity must be greater than zero",
    );
  }

  const product = await repository.findProduct(productId);

  if (!product) {
    throw new NotFoundException(
      "Product not found",
    );
  }

  const updated = await repository.reserveStock(
    productId,
    quantity,
  );

  if (updated === 0) {
    throw new BadRequestException(
      "Insufficient stock",
    );
  }

  await invalidateProductCache(productId);

  logger.info(
    {
      productId,
      quantity,
    },
    "Stock reserved",
  );

  return repository.findProduct(productId);
}

export async function releaseStock(
  productId: string,
  quantity: number,
) {
  if (quantity <= 0) {
    throw new BadRequestException(
      "Quantity must be greater than zero",
    );
  }

  const product = await repository.findProduct(productId);

  if (!product) {
    throw new NotFoundException(
      "Product not found",
    );
  }

  const updated = await repository.releaseStock(
    productId,
    quantity,
  );

  await invalidateProductCache(productId);

  logger.info(
    {
      productId,
      quantity,
    },
    "Stock released",
  );

  return updated;
}

export async function setStock(
  productId: string,
  quantity: number,
) {
  if (quantity < 0) {
    throw new BadRequestException(
      "Stock cannot be negative",
    );
  }

  const product = await repository.findProduct(productId);

  if (!product) {
    throw new NotFoundException(
      "Product not found",
    );
  }

  const updated = await repository.updateStock(
    productId,
    quantity,
  );

  await invalidateProductCache(productId);

  logger.info(
    {
      productId,
      previousStock: product.stock,
      stock: quantity,
    },
    "Stock updated",
  );

  return updated;
}

async function invalidateProductCache(
  productId: string,
) {
  await Promise.all([
    cache.remove(
      CacheKeys.product(productId),
    ),
    cache.clearPattern("products:*"),
  ]);
}