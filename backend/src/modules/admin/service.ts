
import { OrderStatus, PaymentProvider, PaymentStatus, ReviewStatus, type Role } from "../../generated/prisma/client";
import cloudinary from "../../config/cloudinary";
import { razorpayProvider } from "../payment/providers/razorpay";
import { stripeProvider } from "../payment/providers/stripe";
import { BadRequestException } from "../../exceptions/BadRequestException";
import { NotFoundException } from "../../exceptions/NotFoundException";
import { cache, CacheKeys } from "../redis";
import * as repository from "./repository";
import type {
  AnalyticsQuery,
  OrderListQuery,
  UpdateOrderStatusInput,
  UserListQuery,
} from "./schema";

const allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function listUsers(query: UserListQuery) {
  return repository.findUsers(query);
}

export async function getUser(id: string) {
  const user = await repository.findUserById(id);
  if (!user) throw new NotFoundException("User not found");
  return user;
}

export function listOrders(query: OrderListQuery) {
  return repository.findOrders(query);
}

export async function getOrder(id: string) {
  const order = await repository.findOrderById(id);
  if (!order) throw new NotFoundException("Order not found");
  return order;
}

export async function changeOrderStatus(
  id: string,
  input: UpdateOrderStatusInput
) {
  const order = await getOrder(id);
  const next = input.status;

  if (order.status === next) return order;

  if (!allowedTransitions[order.status].includes(next)) {
    throw new BadRequestException(
      `Invalid order status transition: ${order.status} -> ${next}`
    );
  }

  // A paid order cannot be cancelled until a real refund workflow exists.
  if (next === OrderStatus.CANCELLED && order.paymentStatus === "PAID") {
    throw new BadRequestException(
      "Paid orders cannot be cancelled until the refund workflow is implemented"
    );
  }

  return repository.updateOrderStatus(id, next);
}

export async function getDashboard() {
  const [kpis, recentOrders, statusCounts, topProducts] = await Promise.all([
    repository.dashboardKpis(),
    repository.recentOrders(10),
    repository.orderStatusCounts(),
    repository.topSellingProducts(undefined, undefined, 10),
  ]);

  return {
    kpis,
    recentOrders,
    orderStatusCounts: statusCounts.map((item) => ({
      status: item.status,
      count: item._count._all,
    })),
    topSellingProducts: topProducts.map((item) => ({
      ...item,
      quantitySold: Number(item.quantitySold),
      revenue: Number(item.revenue),
    })),
  };
}

export async function getAnalytics(query: AnalyticsQuery) {
  const to = query.to ?? new Date();
  const from =
    query.from ??
    new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000);

  if (from > to) {
    throw new BadRequestException("Analytics 'from' date must be before 'to' date");
  }

  const [kpis, salesByDay, topProducts, statusCounts] = await Promise.all([
    repository.dashboardKpis(),
    repository.salesByDay(from, to),
    repository.topSellingProducts(from, to, 20),
    repository.orderStatusCounts(),
  ]);

  return {
    range: { from, to },
    kpis,
    salesByDay: salesByDay.map((item) => ({
      date: item.date,
      orders: Number(item.orders),
      revenue: Number(item.revenue),
    })),
    topSellingProducts: topProducts.map((item) => ({
      ...item,
      quantitySold: Number(item.quantitySold),
      revenue: Number(item.revenue),
    })),
    orderStatusCounts: statusCounts.map((item) => ({
      status: item.status,
      count: item._count._all,
    })),
  };
}


export async function updateUser(id: string, input: import("./schema").UpdateUserInput, actor: { id: string; role: Role }) {
  const existing = await repository.findUserById(id);
  if (!existing) throw new NotFoundException("User not found");
  if (actor.id === id && input.isActive === false) throw new BadRequestException("You cannot deactivate your own account");
  if (actor.role === "ADMIN") {
    if (existing.role !== "USER" || input.role === "ADMIN" || input.role === "SUPER_ADMIN") {
      throw new BadRequestException("Admins can only manage customer accounts");
    }
  }
  if (input.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    throw new BadRequestException("Only a super administrator can grant super administrator access");
  }
  if (existing.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
    throw new BadRequestException("Only a super administrator can modify another super administrator");
  }
  return repository.updateUser(id, input);
}

export async function deleteUser(id: string, actor: { id: string; role: Role }) {
  const existing = await repository.findUserById(id);
  if (!existing) throw new NotFoundException("User not found");
  if (actor.id === id) throw new BadRequestException("You cannot deactivate your own account");
  if (actor.role === "ADMIN" && existing.role !== "USER") throw new BadRequestException("Admins can only deactivate customer accounts");
  if (existing.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") throw new BadRequestException("Only a super administrator can deactivate another super administrator");
  return repository.deactivateUser(id);
}

export async function listReviews(query: import("./schema").ReviewListQuery) {
  return repository.findReviews(query);
}

export async function updateReviewStatus(id: string, input: import("./schema").UpdateReviewStatusInput) {
  const review = await repository.findReviewById(id);
  if (!review) throw new NotFoundException("Review not found");
  const result = await repository.setReviewStatus(id, input.status);
  await Promise.all([
    cache.remove(CacheKeys.productReviews(review.productId)),
    cache.remove(CacheKeys.productRating(review.productId)),
  ]);
  return result;
}

export async function deleteReview(id: string) {
  const review = await repository.findReviewById(id);
  if (!review) throw new NotFoundException("Review not found");
  await repository.deleteReview(id);
  await Promise.all([
    cache.remove(CacheKeys.productReviews(review.productId)),
    cache.remove(CacheKeys.productRating(review.productId)),
  ]);
  return { success: true };
}

export async function attachProductImage(productId: string, input: import("./schema").AttachProductImageInput) {
  const product = await repository.findProductById(productId);
  if (!product) throw new NotFoundException("Product not found");
  if (product.images.some((image) => image.publicId === input.publicId)) {
    throw new BadRequestException("This image is already attached to the product");
  }
  const image = await repository.attachProductImage(productId, input);
  await Promise.all([cache.remove(CacheKeys.product(productId)), cache.clearPattern("products:*")]);
  return image;
}

export async function setPrimaryProductImage(productId: string, imageId: string) {
  const image = await repository.findProductImage(productId, imageId);
  if (!image) throw new NotFoundException("Product image not found");
  const result = await repository.setPrimaryProductImage(productId, imageId);
  await Promise.all([cache.remove(CacheKeys.product(productId)), cache.clearPattern("products:*")]);
  return result;
}

export async function deleteProductImage(productId: string, imageId: string) {
  const image = await repository.findProductImage(productId, imageId);
  if (!image) throw new NotFoundException("Product image not found");
  const result = await repository.deleteProductImage(productId, imageId);
  try {
    await cloudinary.uploader.destroy(image.publicId);
  } catch {
    // Database state remains authoritative; orphaned Cloudinary media can be cleaned separately.
  }
  await Promise.all([cache.remove(CacheKeys.product(productId)), cache.clearPattern("products:*")]);
  return { success: true, image: result };
}

export async function listPayments(query: import("./schema").PaymentListQuery) {
  return repository.findPayments(query);
}

export async function refundPayment(id: string, input: { reason?: string }) {
  const payment = await repository.findPaymentForRefund(id);
  if (!payment) throw new NotFoundException("Payment not found");
  if (payment.status === PaymentStatus.REFUNDED) return { success: true, alreadyRefunded: true, payment };
  if (payment.status !== PaymentStatus.PAID) throw new BadRequestException("Only paid payments can be refunded");
  if (!payment.providerPaymentId) throw new BadRequestException("Payment provider transaction ID is missing");

  const order = await repository.findOrderByPaymentId(payment.id);
  if (order?.status === OrderStatus.DELIVERED) {
    throw new BadRequestException("Delivered orders require a return workflow before refund");
  }
  if (order?.status === OrderStatus.CANCELLED && payment.status !== PaymentStatus.PAID) {
    throw new BadRequestException("The order is already cancelled");
  }

  const gateway = payment.provider === PaymentProvider.RAZORPAY ? razorpayProvider : stripeProvider;
  await gateway.refund(payment.providerPaymentId, Number(payment.amount));

  const result = await repository.markRefunded(payment.id, order?.id, Boolean(order && order.status !== OrderStatus.SHIPPED));
  return {
    success: true,
    alreadyRefunded: false,
    reason: input.reason,
    ...result,
  };
}
