import bcrypt from "bcrypt";
import { prisma } from "../../src/db/prisma";
import { ProductStatus, Role } from "../../src/generated/prisma/client";

export async function createAdmin() {
  return prisma.user.create({
    data: {
      name: "Admin",
      email: `admin-${crypto.randomUUID()}@test.com`,
      password: await bcrypt.hash("Password@123", 10),
      role: Role.ADMIN,
    },
  });
}

export async function createCategory() {
  return prisma.category.create({
    data: {
      name: `Category-${crypto.randomUUID()}`,
      slug: `category-${crypto.randomUUID()}`,
    },
  });
}

export async function createProduct(categoryId: string) {
  return prisma.product.create({
    data: {
      name: "MacBook Pro",
      slug: `macbook-${crypto.randomUUID()}`,
      description: "MacBook Pro for testing.",
      price: 100000,
      stock: 10,
      categoryId,
      status: ProductStatus.ACTIVE,
    },
  });
}