import type { Context } from "hono";
import { z } from "zod";
import * as service from "./service";
import { AppError } from "../../exceptions/AppError";
import {
  attachProductImageSchema,
  userListQuerySchema,
  orderListQuerySchema,
  updateOrderStatusSchema,
  updateUserSchema,
  reviewListQuerySchema,
  updateReviewStatusSchema,
  paymentListQuerySchema,
  refundPaymentSchema,
} from "./schema";

export const listUsers = async (c: Context) => c.json(await service.listUsers(userListQuerySchema.parse(c.req.query())));

export const getUser = async (c: Context) => {
  const id = c.req.param("id");
  if (!id) throw new AppError("User ID is required", 400);
  return c.json(await service.getUser(id));
};

export const updateUser = async (c: Context) => {
  const id = c.req.param("id");
  if (!id) throw new AppError("User ID is required", 400);
  return c.json(await service.updateUser(id, updateUserSchema.parse(await c.req.json()), c.get("user")));
};

export const deleteUser = async (c: Context) => {
  const id = c.req.param("id");
  if (!id) throw new AppError("User ID is required", 400);
  return c.json(await service.deleteUser(id, c.get("user")));
};

export const listOrders = async (c: Context) => c.json(await service.listOrders(orderListQuerySchema.parse(c.req.query())));

export const getOrder = async (c: Context) => {
  const id = c.req.param("id");
  if (!id) throw new AppError("Order ID is required", 400);
  return c.json(await service.getOrder(id));
};

export const updateOrderStatus = async (c: Context) => {
  const id = c.req.param("id");
  if (!id) throw new AppError("Order ID is required", 400);
  return c.json(await service.changeOrderStatus(id, updateOrderStatusSchema.parse(await c.req.json())));
};

export const listReviews = async (c: Context) => c.json(await service.listReviews(reviewListQuerySchema.parse(c.req.query())));

export const updateReviewStatus = async (c: Context) => {
  const id = c.req.param("id");
  if (!id) throw new AppError("Review ID is required", 400);
  return c.json(await service.updateReviewStatus(id, updateReviewStatusSchema.parse(await c.req.json())));
};

export const deleteReview = async (c: Context) => {
  const id = c.req.param("id");
  if (!id) throw new AppError("Review ID is required", 400);
  return c.json(await service.deleteReview(id));
};

export const attachProductImage = async (c: Context) => {
  const productId = c.req.param("productId");
  if (!productId) throw new AppError("Product ID is required", 400);
  return c.json(await service.attachProductImage(productId, attachProductImageSchema.parse(await c.req.json())), 201);
};

export const setPrimaryProductImage = async (c: Context) => {
  const productId = c.req.param("productId");
  const imageId = c.req.param("imageId");
  if (!productId || !imageId) throw new AppError("Product and image IDs are required", 400);
  return c.json(await service.setPrimaryProductImage(productId, imageId));
};

export const deleteProductImage = async (c: Context) => {
  const productId = c.req.param("productId");
  const imageId = c.req.param("imageId");
  if (!productId || !imageId) throw new AppError("Product and image IDs are required", 400);
  return c.json(await service.deleteProductImage(productId, imageId));
};

export const listPayments = async (c: Context) => c.json(await service.listPayments(paymentListQuerySchema.parse(c.req.query())));

export const refundPayment = async (c: Context) => {
  const id = c.req.param("id");
  if (!id) throw new AppError("Payment ID is required", 400);
  return c.json(await service.refundPayment(id, refundPaymentSchema.parse(await c.req.json())));
};

export const dashboard = async (c: Context) => c.json(await service.getDashboard());
export const analytics = async (c: Context) => c.json(await service.getAnalytics(c.req.query()));
