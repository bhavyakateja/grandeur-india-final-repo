import type { Context } from "hono";
import { z } from "zod";

import * as service from "./service";
import * as shippingService from "../shipping/service";

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

/* -------------------------------------------------------------------------- */
/* Shipping – Delhivery integration                                          */
/* -------------------------------------------------------------------------- */

export const createShipment = async (c: Context) => {
  const id = c.req.param("id");
  if (!id) throw new Error("id is required");
  return successResponse(
    c,
    await shippingService.createShipmentForOrder(id),
    "Delhivery shipment created",
    201,
  );
};

const updateShipmentBodySchema = z.object({
  courier: z.string().trim().min(1).optional(),
  waybill: z.string().trim().min(1).optional(),
  shippingStatus: z.string().trim().min(1).optional(),
  trackingUrl: z.string().url().optional(),
});

export const updateShipment = async (c: Context) => {
  const id = c.req.param("id");
  if (!id) throw new Error("id is required");
  const input = updateShipmentBodySchema.parse(await c.req.json());
  return successResponse(
    c,
    await shippingService.updateShipmentForOrder(id, input),
    "Shipment details updated",
  );
};

export const trackOrder = async (c: Context) => {
  const id = c.req.param("id");
  if (!id) throw new Error("id is required");
  return successResponse(c, await shippingService.trackOrder(id));
};

export const getPackingSlip = async (c: Context) => {
  const id = c.req.param("id");
  if (!id) throw new Error("id is required");
  return successResponse(c, await shippingService.getPackingSlipUrl(id));
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

export const dispatchInternational = async (c: Context) => {
  const id = c.req.param("id");
  if (!id) throw new Error("id is required");
  const input = z.object({
    courier: z.string().trim().min(2).max(50),
    waybill: z.string().trim().min(2).max(100),
    trackingUrl: z.string().url().optional(),
  }).parse(await c.req.json());
  return successResponse(
    c,
    await shippingService.updateShipmentForOrder(id, {
      ...input,
      shippingStatus: "DISPATCHED",
    }),
    "International shipment dispatched",
  );
};