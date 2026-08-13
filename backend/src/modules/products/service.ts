import * as repository from "./repository";

import { Prisma } from "../../generated/prisma/client";

import { NotFoundException } from "../../exceptions/NotFoundException";
import { cache, CacheKeys } from "../redis";

import type {
  CreateProductInput,
  UpdateProductInput,
  ProductQuery,
} from "./schema";

function createSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
}

export async function create(data: CreateProductInput) {
  const slug = createSlug(data.name);

  const product = await repository.create({
    name: data.name,
    slug,
    description: data.description,
    price: new Prisma.Decimal(data.price),
    stock: data.stock,
    status: data.status,
    category: {
      connect: {
        id: data.categoryId,
      },
    },
  });
  await Promise.all([cache.clearPattern("products:*"), cache.remove(CacheKeys.category(data.categoryId))]);
  return product;
}

export async function getAll(query: ProductQuery) {
  const { products, total } =
    await repository.findAll(query);

  return {
    items: products,

    pagination: {
      page: query.page,

      limit: query.limit,

      total,

      totalPages: Math.ceil(
        total / query.limit
      ),
    },
  };
}

export async function getById(id: string) {
  const product = await repository.findById(id);

  if (!product) {
    throw new NotFoundException("Product not found");
  }

  return product;
}

export async function update(
  id: string,
  data: UpdateProductInput
) {
  const existing = await getById(id);

  const updateData: Prisma.ProductUpdateInput = {};

  if (data.name) {
    updateData.name = data.name;
    updateData.slug = createSlug(data.name);
  }

  if (data.description !== undefined) {
    updateData.description = data.description;
  }

  if (data.price !== undefined) {
    updateData.price = new Prisma.Decimal(data.price);
  }

  if (data.stock !== undefined) {
    updateData.stock = data.stock;
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  if (data.categoryId) {
    updateData.category = {
      connect: {
        id: data.categoryId,
      },
    };
  }

  const product = await repository.update(id, updateData);
  await Promise.all([
    cache.remove(CacheKeys.product(id)),
    cache.remove(CacheKeys.category(existing.categoryId)),
    data.categoryId && data.categoryId !== existing.categoryId ? cache.remove(CacheKeys.category(data.categoryId)) : Promise.resolve(),
    cache.clearPattern("products:*"),
  ]);
  return product;
}

export async function remove(id: string) {
  const product = await getById(id);

  await repository.remove(id);
  await Promise.all([cache.remove(CacheKeys.product(id)), cache.remove(CacheKeys.category(product.categoryId)), cache.clearPattern("products:*")]);
}
