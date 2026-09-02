import type { Context } from "hono";

import * as service from "./service";

import {
  analyticsQuerySchema,
  attachProductImageSchema,
  attachProductImagesSchema,
  orderListQuerySchema,
  paymentListQuerySchema,
  refundPaymentSchema,
  reviewListQuerySchema,
  updateOrderStatusSchema,
  updateReviewStatusSchema,
  updateUserSchema,
  userListQuerySchema,
} from "./schema";

import { AppError } from "../../exceptions/AppError";
import { successResponse } from "../../shared/response";

function requiredParam(
  c: Context,
  name: string,
): string {
  const value = c.req.param(name);

  if (!value) {
    throw new AppError(
      `${name} is required`,
      400,
    );
  }

  return value;
}

export const listUsers = async (c: Context) => {
  const query =
    userListQuerySchema.parse(
      c.req.query(),
    );

  return successResponse(
    c,
    await service.listUsers(query),
  );
};

export const getUser = async (c: Context) => {
  return successResponse(
    c,
    await service.getUser(
      requiredParam(c, "id"),
    ),
  );
};

export const updateUser = async (
  c: Context,
) => {
  const input =
    updateUserSchema.parse(
      await c.req.json(),
    );

  return successResponse(
    c,
    await service.updateUser(
      requiredParam(c, "id"),
      input,
      c.get("user"),
    ),
    "User updated successfully",
  );
};

export const deleteUser = async (
  c: Context,
) => {
  return successResponse(
    c,
    await service.deleteUser(
      requiredParam(c, "id"),
      c.get("user"),
    ),
    "User deactivated successfully",
  );
};

export const listOrders = async (
  c: Context,
) => {
  return successResponse(
    c,
    await service.listOrders(
      orderListQuerySchema.parse(
        c.req.query(),
      ),
    ),
  );
};

export const getOrder = async (
  c: Context,
) => {
  return successResponse(
    c,
    await service.getOrder(
      requiredParam(c, "id"),
    ),
  );
};

export const updateOrderStatus = async (
  c: Context,
) => {
  const input =
    updateOrderStatusSchema.parse(
      await c.req.json(),
    );

  return successResponse(
    c,
    await service.changeOrderStatus(
      requiredParam(c, "id"),
      input,
    ),
    "Order status updated successfully",
  );
};

export const listReviews = async (
  c: Context,
) => {
  return successResponse(
    c,
    await service.listReviews(
      reviewListQuerySchema.parse(
        c.req.query(),
      ),
    ),
  );
};

export const updateReviewStatus = async (
  c: Context,
) => {
  const input =
    updateReviewStatusSchema.parse(
      await c.req.json(),
    );

  return successResponse(
    c,
    await service.updateReviewStatus(
      requiredParam(c, "id"),
      input,
    ),
    "Review status updated successfully",
  );
};

export const deleteReview = async (
  c: Context,
) => {
  return successResponse(
    c,
    await service.deleteReview(
      requiredParam(c, "id"),
    ),
    "Review deleted successfully",
  );
};

export const attachProductImage = async (
  c: Context,
) => {
  const input =
    attachProductImageSchema.parse(
      await c.req.json(),
    );

  return successResponse(
    c,
    await service.attachProductImage(
      requiredParam(c, "productId"),
      input,
    ),
    "Product image attached successfully",
    201,
  );
};

export const setPrimaryProductImage = async (
  c: Context,
) => {
  return successResponse(
    c,
    await service.setPrimaryProductImage(
      requiredParam(c, "productId"),
      requiredParam(c, "imageId"),
    ),
    "Primary image updated successfully",
  );
};

export const deleteProductImage = async (
  c: Context,
) => {
  return successResponse(
    c,
    await service.deleteProductImage(
      requiredParam(c, "productId"),
      requiredParam(c, "imageId"),
    ),
    "Product image deleted successfully",
  );
};

export const attachProductImages = async (
  c: Context,
) => {
  const input =
    attachProductImagesSchema.parse(
      await c.req.json(),
    );

  return successResponse(
    c,
    await service.attachProductImages(
      requiredParam(c, "productId"),
      input,
    ),
    "Product images attached successfully",
    201,
  );
};

export const getProductImageUploadSignature = async (
  c: Context,
) => {
  const productId = requiredParam(
    c,
    "productId",
  );

  return successResponse(
    c,
    await service.getProductImageUploadSignature(
      productId,
    ),
  );
};

export const listPayments = async (
  c: Context,
) => {
  return successResponse(
    c,
    await service.listPayments(
      paymentListQuerySchema.parse(
        c.req.query(),
      ),
    ),
  );
};

export const refundPayment = async (
  c: Context,
) => {
  const input =
    refundPaymentSchema.parse(
      await c.req.json(),
    );

  return successResponse(
    c,
    await service.refundPayment(
      requiredParam(c, "id"),
      input,
    ),
    "Payment refunded successfully",
  );
};

export const dashboard = async (
  c: Context,
) => {
  return successResponse(
    c,
    await service.getDashboard(),
  );
};

export const analytics = async (
  c: Context,
) => {
  return successResponse(
    c,
    await service.getAnalytics(
      analyticsQuerySchema.parse(
        c.req.query(),
      ),
    ),
  );
};