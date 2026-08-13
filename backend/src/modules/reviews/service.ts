import * as repository from "./repository";

import {
  BadRequestException,
} from "../../exceptions/BadRequestException";

import {
  NotFoundException,
} from "../../exceptions/NotFoundException";
import { cache, CacheKeys } from "../redis";

import type {
  CreateReviewInput,
  UpdateReviewInput,
} from "./schema";

export async function create(
  userId: string,
  data: CreateReviewInput
) {
  const purchased = await repository.hasPurchased(
    userId,
    data.productId
  );

  if (!purchased) {
    throw new BadRequestException(
      "You can only review purchased products."
    );
  }

  const existing =
    await repository.findByUserAndProduct(
      userId,
      data.productId
    );

  if (existing) {
    throw new BadRequestException(
      "You have already reviewed this product."
    );
  }

  const review = await repository.create(userId, data);
  await Promise.all([cache.remove(CacheKeys.productReviews(data.productId)), cache.remove(CacheKeys.productRating(data.productId))]);
  return review;
}

export async function getProductReviews(
  productId: string
) {
  return repository.findByProduct(productId);
}

export async function getReview(
  id: string
) {
  const review = await repository.findById(id);

  if (!review) {
    throw new NotFoundException(
      "Review not found."
    );
  }

  return review;
}

export async function update(
  userId: string,
  reviewId: string,
  data: UpdateReviewInput
) {
  const review = await repository.findById(
    reviewId
  );

  if (!review) {
    throw new NotFoundException(
      "Review not found."
    );
  }

  if (review.userId !== userId) {
    throw new BadRequestException(
      "You cannot update this review."
    );
  }

  const updated = await repository.update(reviewId, data);
  await Promise.all([cache.remove(CacheKeys.productReviews(review.productId)), cache.remove(CacheKeys.productRating(review.productId))]);
  return updated;
}

export async function remove(
  userId: string,
  reviewId: string
) {
  const review = await repository.findById(
    reviewId
  );

  if (!review) {
    throw new NotFoundException(
      "Review not found."
    );
  }

  if (review.userId !== userId) {
    throw new BadRequestException(
      "You cannot delete this review."
    );
  }

  await repository.remove(reviewId);
  await Promise.all([cache.remove(CacheKeys.productReviews(review.productId)), cache.remove(CacheKeys.productRating(review.productId))]);

  return {
    success: true,
  };
}

export async function getAverageRating(
  productId: string
) {
  return repository.getAverageRating(
    productId
  );
}
