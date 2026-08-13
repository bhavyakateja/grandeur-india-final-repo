import { prisma } from "../../db/prisma";
import { Prisma, type User } from "../../generated/prisma/client";

export async function findByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function findById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function createUser(data: Prisma.UserCreateInput) {
  return prisma.user.create({
    data,
  });
}

export async function updateLastLogin(userId: string) {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      lastLoginAt: new Date(),
    },
  });
}

export async function updatePassword(
  userId: string,
  hashedPassword: string
) {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });
}

export async function getProfile(userId: string) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      isVerified: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function saveRefreshToken(
  userId: string,
  tokenHash: string,
  userAgent?: string,
  ipAddress?: string
) {
  return prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      userAgent,
      ipAddress,
      expiresAt: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ),
    },
  });
}

export async function findRefreshToken(
  tokenHash: string
) {
  return prisma.refreshToken.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: true,
    },
  });
}

export async function revokeRefreshToken(
  tokenHash: string
) {
  return prisma.refreshToken.update({
    where: {
      tokenHash,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function deleteUserRefreshTokens(
  userId: string
) {
  return prisma.refreshToken.deleteMany({
    where: {
      userId,
    },
  });
}