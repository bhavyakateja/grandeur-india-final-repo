import { Prisma } from "../../generated/prisma/client";
import * as repository from "./repository";

import {
  NotFoundException,
} from "../../exceptions/NotFoundException";

import {
  ConflictException,
} from "../../exceptions/ConflictException";

import { cache, CacheKeys } from "../redis";
import cloudinary  from "@/config/cloudinary";
import { env } from "../../config/env";

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
      imageUrl: data.imageUrl ?? null,
      imagePublicId:
        data.imagePublicId ?? null,
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
  const existingCategory =
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

  if (data.imagePublicId !== undefined) {
    updateData.imagePublicId =
      data.imagePublicId;
  }

  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  if (
    Object.keys(updateData).length === 0
  ) {
    return existingCategory;
  }

  const category =
    await repository.update(
      id,
      updateData,
    );

  /*
   * If the image was replaced, clean up
   * the previous Cloudinary asset.
   */
  if (
    data.imagePublicId !== undefined &&
    data.imagePublicId !==
      existingCategory.imagePublicId
  ) {
    const oldPublicId =
      existingCategory.imagePublicId;

    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(
          oldPublicId,
          {
            resource_type: "image",
          },
        );
      } catch {
        // Do not fail the category update
        // because Cloudinary cleanup failed.
      }
    }
  }

  await invalidateCategoryCache(id);

  return category;
}

export async function remove(
  id: string,
) {
  const category =
    await getById(id);

  const result =
    await repository.deactivate(id);

  /*
   * Category deletion is actually a soft
   * deactivate operation. We deliberately
   * keep the Cloudinary image because the
   * database record still exists.
   */
  await invalidateCategoryCache(id);

  return result;
}

/**
 * Generate a signed Cloudinary upload
 * configuration for one category image.
 *
 * The API secret NEVER leaves the backend.
 */
export async function getImageUploadSignature(
  categoryId: string,
) {
  await getById(categoryId);

  const timestamp =
    Math.floor(Date.now() / 1000);

  const folder =
    `ecommerce/categories/${categoryId}`;

  const paramsToSign = {
    timestamp,
    folder,
  };

  const signature =
    cloudinary.utils.api_sign_request(
      paramsToSign,
      env.CLOUDINARY_API_SECRET,
    );

  return {
    signature,
    timestamp,
    folder,
    cloudName:
      env.CLOUDINARY_CLOUD_NAME,
    apiKey:
      env.CLOUDINARY_API_KEY,
  };
}