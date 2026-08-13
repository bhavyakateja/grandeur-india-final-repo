import { prisma } from "../../db/prisma";

import type {
  CreateReviewInput,
  UpdateReviewInput,
} from "./schema";

export function create(
  userId: string,
  data: CreateReviewInput
) {
  return prisma.review.create({
    data: {
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      userId,
      productId: data.productId,
      images: {
        create: data.images.map((url) => ({
          url,
        })),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      images: true,
    },
  });
}

export function findById(id: string) {
  return prisma.review.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      images: true,
    },
  });
}

export function findByUserAndProduct(
  userId: string,
  productId: string
) {
  return prisma.review.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });
}

export function findByProduct(productId: string) {
  return prisma.review.findMany({
    where: {
      productId,
      status: "APPROVED",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      images: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export function update(
  id: string,
  data: UpdateReviewInput
) {
  return prisma.review.update({
    where: {
      id,
    },
    data: {
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      ...(data.images && {
        images: {
          deleteMany: {},
          create: data.images.map((url) => ({
            url,
          })),
        },
      }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      images: true,
    },
  });
}

export function remove(id: string) {
  return prisma.review.delete({
    where: {
      id,
    },
  });
}

export function hasPurchased(
  userId: string,
  productId: string
) {
  return prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId,
      },
    },
  });
}

export function getAverageRating(
  productId: string
) {
  return prisma.review.aggregate({
    where: {
      productId,
      status: "APPROVED",
    },
    _avg: {
      rating: true,
    },
    _count: true,
  });
}