import { prisma } from "../../db/prisma";
import { Prisma } from "../../generated/prisma/client";

import type { CategoryQuery } from "./schema";

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  imageUrl: true,
  isActive: true,
} satisfies Prisma.CategorySelect;

export function create(
  data: Prisma.CategoryCreateInput,
) {
  return prisma.category.create({
    data,
    select: categorySelect,
  });
}

export function findById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    select: {
      ...categorySelect,
      _count: {
        select: {
          products: true,
        },
      },
    },
  });
}

export function findBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    select: categorySelect,
  });
}

export function findAll(
  query: CategoryQuery,
) {
  const where: Prisma.CategoryWhereInput = {
    isActive: true,
    ...(query.search
      ? {
          name: {
            contains: query.search,
            mode: "insensitive",
          },
        }
      : {}),
  };

  return prisma.category.findMany({
    where,
    select: {
      ...categorySelect,
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

export function update(
  id: string,
  data: Prisma.CategoryUpdateInput,
) {
  return prisma.category.update({
    where: { id },
    data,
    select: categorySelect,
  });
}

export function deactivate(id: string) {
  return prisma.category.update({
    where: { id },
    data: {
      isActive: false,
    },
    select: categorySelect,
  });
}