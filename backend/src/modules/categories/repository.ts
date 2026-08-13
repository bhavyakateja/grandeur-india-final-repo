import { prisma } from "../../db/prisma";
import { Prisma } from "../../generated/prisma/client";
import type { CategoryQuery } from "./schema";

const categoryInclude = {
  products: true,
} satisfies Prisma.CategoryInclude;

export async function create(data: Prisma.CategoryCreateInput) {
  return prisma.category.create({
    data,
    include: categoryInclude,
  });
}

export async function findById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: categoryInclude,
  });
}

export async function findBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
  });
}

export async function findAll(query: CategoryQuery) {
  const { search } = query;

  const where: Prisma.CategoryWhereInput = {};

  if (search) {
    where.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  return prisma.category.findMany({
    where,
    include: categoryInclude,
    orderBy: {
      name: "asc",
    },
  });
}

export async function update(
  id: string,
  data: Prisma.CategoryUpdateInput
) {
  return prisma.category.update({
    where: { id },
    data,
    include: categoryInclude,
  });
}

export async function remove(id: string) {
  return prisma.category.delete({
    where: { id },
  });
}