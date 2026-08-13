import { prisma } from "../../src/db/prisma";

export async function createCategory() {
  return prisma.category.create({
    data: {
      name: `Category-${crypto.randomUUID()}`,
      slug: `category-${crypto.randomUUID()}`,
    },
  });
}