import bcrypt from "bcrypt";

import { prisma } from "../../src/db/prisma";
import { Role } from "../../src/generated/prisma/client";

export async function createUser(
  role: Role = Role.USER
) {
  const email = `user-${crypto.randomUUID()}@test.com`;

  const user = await prisma.user.create({
    data: {
      name: "Test User",
      email,
      password: await bcrypt.hash("Password@123", 10),
      role,
    },
  });

  return {
    ...user,
    plainPassword: "Password@123",
  };
}

export async function createAdmin() {
  return createUser(Role.ADMIN);
}