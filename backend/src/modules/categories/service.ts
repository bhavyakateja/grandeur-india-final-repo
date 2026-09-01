import { Prisma } from "../../generated/prisma/client";

import * as repository from "./repository";

import {
  NotFoundException,
} from "../../exceptions/NotFoundException";

import {
  ConflictException,
} from "../../exceptions/ConflictException";

import { cache, CacheKeys } from "../redis";

import type {
  CategoryQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./schema";

function createSlug(name: string): string {
  return name
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function invalidateCategoryCache(
  id?: string,
) {
  const tasks: Promise<unknown>[] = [
    cache.clearPattern("categories*"),
    cache.clearPattern("products:*"),
  ];

  if (id) {
    tasks.push(
      cache.remove(
        CacheKeys.category(id),
      ),
    );
  }

  await Promise.all(tasks);
}

export async function create(
  data: CreateCategoryInput,
) {
  const slug = createSlug(data.name);

  if (!slug) {
    throw new ConflictException(
      "Category name cannot produce a valid slug",
    );
  }

  const existing =
    await repository.findBySlug(slug);

  if (existing) {
    throw new ConflictException(
      "Category already exists",
    );
  }

  const category =
    await repository.create({
      name: data.name,
      slug,
      imageUrl: data.imageUrl,
      isActive: data.isActive,
    });

  await invalidateCategoryCache();

  return category;
}

export function getAll(
  query: CategoryQuery,
) {
  return repository.findAll(query);
}

export async function getById(
  id: string,
) {
  const category =
    await repository.findById(id);

  if (!category) {
    throw new NotFoundException(
      "Category not found",
    );
  }

  return category;
}

export async function update(
  id: string,
  data: UpdateCategoryInput,
) {
  await getById(id);

  const updateData: Prisma.CategoryUpdateInput =
    {};

  if (data.name !== undefined) {
    const slug = createSlug(data.name);

    if (!slug) {
      throw new ConflictException(
        "Category name cannot produce a valid slug",
      );
    }

    const existing =
      await repository.findBySlug(slug);

    if (
      existing &&
      existing.id !== id
    ) {
      throw new ConflictException(
        "Category slug already exists",
      );
    }

    updateData.name = data.name;
    updateData.slug = slug;
  }

  if (data.imageUrl !== undefined) {
    updateData.imageUrl = data.imageUrl;
  }

  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  if (
    Object.keys(updateData).length === 0
  ) {
    return getById(id);
  }

  const category =
    await repository.update(
      id,
      updateData,
    );

  await invalidateCategoryCache(id);

  return category;
}

export async function remove(
  id: string,
) {
  await getById(id);

  const category =
    await repository.deactivate(id);

  await invalidateCategoryCache(id);

  return category;
}