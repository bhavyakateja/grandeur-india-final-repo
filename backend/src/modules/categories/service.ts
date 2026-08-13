import * as repository from "./repository";

import { Prisma } from "../../generated/prisma/client";
import { NotFoundException } from "../../exceptions/NotFoundException";
import { ConflictException } from "../../exceptions/ConflictException";
import { cache, CacheKeys } from "../redis";

import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryQuery,
} from "./schema";

function createSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
}

export async function create(data: CreateCategoryInput) {
  const slug = createSlug(data.name);

  const existing = await repository.findBySlug(slug);

  if (existing) {
    throw new ConflictException("Category already exists");
  }

  const category = await repository.create({
    name: data.name,
    slug,
    imageUrl: data.imageUrl,
    isActive: data.isActive,
  });
  await cache.clearPattern("categories*");
  return category;
}

export async function getAll(query: CategoryQuery) {
  return repository.findAll(query);
}

export async function getById(id: string) {
  const category = await repository.findById(id);

  if (!category) {
    throw new NotFoundException("Category not found");
  }

  return category;
}

export async function update(
  id: string,
  data: UpdateCategoryInput
) {
  await getById(id);

  const updateData: Prisma.CategoryUpdateInput = {};

  if (data.name) {
    updateData.name = data.name;
    updateData.slug = createSlug(data.name);
  }

  if (data.imageUrl !== undefined) {
    updateData.imageUrl = data.imageUrl;
  }

  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  const category = await repository.update(id, updateData);
  await Promise.all([cache.remove(CacheKeys.category(id)), cache.clearPattern("categories*"), cache.clearPattern("products:*")]);
  return category;
}

export async function remove(id: string) {
  await getById(id);

  const category = await repository.remove(id);
  await Promise.all([cache.remove(CacheKeys.category(id)), cache.clearPattern("categories*"), cache.clearPattern("products:*")]);
  return category;
}
