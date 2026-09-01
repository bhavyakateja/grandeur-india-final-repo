import {
  OrderStatus,
  PaymentStatus,
  ReviewStatus,
  type Role,
} from "../../generated/prisma/client";

import cloudinary from "../../config/cloudinary";
import { cache, CacheKeys } from "../redis";
import { razorpayProvider } from "../payment/providers/razorpay";

import { BadRequestException } from "../../exceptions/BadRequestException";
import { NotFoundException } from "../../exceptions/NotFoundException";

import * as repository from "./repository";

import type {
  AnalyticsQuery,
  AttachProductImageInput,
  OrderListQuery,
  PaymentListQuery,
  RefundPaymentInput,
  ReviewListQuery,
  UpdateOrderStatusInput,
  UpdateReviewStatusInput,
  UpdateUserInput,
  UserListQuery,
} from "./schema";

const allowedTransitions: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  PENDING: [
    OrderStatus.CONFIRMED,
    OrderStatus.CANCELLED,
  ],
  CONFIRMED: [
    OrderStatus.SHIPPED,
    OrderStatus.CANCELLED,
  ],
  SHIPPED: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
};

export function listUsers(query: UserListQuery) {
  return repository.findUsers(query);
}

export async function getUser(id: string) {
  const user = await repository.findUserById(id);

  if (!user) {
    throw new NotFoundException("User not found");
  }

  return user;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
  actor: {
    id: string;
    role: Role;
  },
) {
  const existing = await repository.findUserById(id);

  if (!existing) {
    throw new NotFoundException("User not found");
  }

  if (
    actor.id === id &&
    input.isActive === false
  ) {
    throw new BadRequestException(
      "You cannot deactivate your own account",
    );
  }

  if (
    actor.role === "ADMIN" &&
    existing.role === "ADMIN" &&
    actor.id !== existing.id
  ) {
    throw new BadRequestException(
      "You cannot modify another administrator",
    );
  }

  if (
    input.role === "ADMIN" &&
    existing.role === "ADMIN" &&
    actor.id !== existing.id
  ) {
    throw new BadRequestException(
      "You cannot modify another administrator",
    );
  }

  return repository.updateUser(id, input);
}

export async function deleteUser(
  id: string,
  actor: {
    id: string;
    role: Role;
  },
) {
  const existing = await repository.findUserById(id);

  if (!existing) {
    throw new NotFoundException("User not found");
  }

  if (actor.id === id) {
    throw new BadRequestException(
      "You cannot deactivate your own account",
    );
  }

  if (existing.role === "ADMIN") {
    throw new BadRequestException(
      "Administrator accounts cannot be deactivated here",
    );
  }

  return repository.deactivateUser(id);
}

export function listOrders(query: OrderListQuery) {
  return repository.findOrders(query);
}

export async function getOrder(id: string) {
  const order = await repository.findOrderById(id);

  if (!order) {
    throw new NotFoundException("Order not found");
  }

  return order;
}

export async function changeOrderStatus(
  id: string,
  input: UpdateOrderStatusInput,
) {
  const order = await getOrder(id);
  const next = input.status;

  if (order.status === next) {
    return order;
  }

  if (
    !(allowedTransitions[order.status] ?? []).includes(next)
  ) {
    throw new BadRequestException(
      `Invalid order status transition: ${order.status} -> ${next}`,
    );
  }

  if (
    next === OrderStatus.CANCELLED &&
    order.paymentStatus === PaymentStatus.PAID
  ) {
    throw new BadRequestException(
      "Paid orders must be refunded before cancellation",
    );
  }

  const updated = await repository.updateOrderStatus(
    id,
    next,
  );

  await cache.remove(CacheKeys.product("*"));

  return updated;
}

export async function getDashboard() {
  const [
    kpis,
    recentOrders,
    statusCounts,
    topProducts,
  ] = await Promise.all([
    repository.dashboardKpis(),
    repository.recentOrders(10),
    repository.orderStatusCounts(),
    repository.topSellingProducts(
      undefined,
      undefined,
      10,
    ),
  ]);

  return {
    kpis,
    recentOrders,
    orderStatusCounts: statusCounts.map(
      (item) => ({
        status: item.status,
        count: item._count._all,
      }),
    ),
    topSellingProducts: topProducts.map(
      (item) => ({
        productId: item.productId,
        productName: item.productName,
        quantitySold: Number(item.quantitySold),
        revenue: item.revenue.toString(),
      }),
    ),
  };
}

export async function getAnalytics(
  query: AnalyticsQuery,
) {
  const to = query.to ?? new Date();

  const from =
    query.from ??
    new Date(
      to.getTime() -
      29 * 24 * 60 * 60 * 1000,
    );

  const [
    kpis,
    salesByDay,
    topProducts,
    statusCounts,
  ] = await Promise.all([
    repository.dashboardKpis(),
    repository.salesByDay(from, to),
    repository.topSellingProducts(
      from,
      to,
      20,
    ),
    repository.orderStatusCounts(),
  ]);

  return {
    range: {
      from,
      to,
    },
    kpis,
    salesByDay: salesByDay.map(
      (item) => ({
        date: item.date,
        orders: Number(item.orders),
        revenue: item.revenue.toString(),
      }),
    ),
    topSellingProducts: topProducts.map(
      (item) => ({
        productId: item.productId,
        productName: item.productName,
        quantitySold: Number(item.quantitySold),
        revenue: item.revenue.toString(),
      }),
    ),
    orderStatusCounts: statusCounts.map(
      (item) => ({
        status: item.status,
        count: item._count._all,
      }),
    ),
  };
}

export async function listReviews(
  query: ReviewListQuery,
) {
  return repository.findReviews(query);
}

export async function updateReviewStatus(
  id: string,
  input: UpdateReviewStatusInput,
) {
  const review =
    await repository.findReviewById(id);

  if (!review) {
    throw new NotFoundException(
      "Review not found",
    );
  }

  const result =
    await repository.setReviewStatus(
      id,
      input.status,
    );

  await Promise.all([
    cache.remove(
      CacheKeys.productReviews(
        review.productId,
      ),
    ),
    cache.remove(
      CacheKeys.productRating(
        review.productId,
      ),
    ),
  ]);

  return result;
}

export async function deleteReview(id: string) {
  const review =
    await repository.findReviewById(id);

  if (!review) {
    throw new NotFoundException(
      "Review not found",
    );
  }

  await repository.deleteReview(id);

  await Promise.all([
    cache.remove(
      CacheKeys.productReviews(
        review.productId,
      ),
    ),
    cache.remove(
      CacheKeys.productRating(
        review.productId,
      ),
    ),
  ]);

  return null;
}

export async function attachProductImage(
  productId: string,
  input: AttachProductImageInput,
) {
  const product =
    await repository.findProductById(
      productId,
    );

  if (!product) {
    throw new NotFoundException(
      "Product not found",
    );
  }

  if (
    product.images.some(
      (image) =>
        image.publicId === input.publicId,
    )
  ) {
    throw new BadRequestException(
      "This image is already attached to the product",
    );
  }

  const image =
    await repository.attachProductImage(
      productId,
      input,
    );

  await cache.remove(
    CacheKeys.product(productId),
  );

  return image;
}

export async function setPrimaryProductImage(
  productId: string,
  imageId: string,
) {
  const image =
    await repository.findProductImage(
      productId,
      imageId,
    );

  if (!image) {
    throw new NotFoundException(
      "Product image not found",
    );
  }

  const result =
    await repository.setPrimaryProductImage(
      productId,
      imageId,
    );

  await cache.remove(
    CacheKeys.product(productId),
  );

  return result;
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
) {
  const image =
    await repository.findProductImage(
      productId,
      imageId,
    );

  if (!image) {
    throw new NotFoundException(
      "Product image not found",
    );
  }

  const result =
    await repository.deleteProductImage(
      productId,
      imageId,
    );

  try {
    await cloudinary.uploader.destroy(
      image.publicId,
    );
  } catch {
    // Database remains authoritative.
  }

  await cache.remove(
    CacheKeys.product(productId),
  );

  return {
    image: result,
  };
}

export function listPayments(
  query: PaymentListQuery,
) {
  return repository.findPayments(query);
}

export async function refundPayment(
  id: string,
  input: RefundPaymentInput,
) {
  const payment =
    await repository.findPaymentForRefund(id);

  if (!payment) {
    throw new NotFoundException(
      "Payment not found",
    );
  }

  if (payment.status === PaymentStatus.REFUNDED) {
    return {
      alreadyRefunded: true,
      payment,
    };
  }

  if (payment.status !== PaymentStatus.PAID) {
    throw new BadRequestException(
      "Only paid payments can be refunded",
    );
  }

  if (!payment.providerPaymentId) {
    throw new BadRequestException(
      "Razorpay payment ID is missing",
    );
  }

  if (!payment.order) {
    throw new NotFoundException(
      "Order associated with payment not found",
    );
  }

  if (payment.order.status === OrderStatus.DELIVERED) {
    throw new BadRequestException(
      "Delivered orders require a return workflow before refund",
    );
  }

  // Convert Decimal rupees to integer paise without floating-point arithmetic.
  const amountStr = payment.amount.toFixed(2);
  const [whole, fractional = ""] = amountStr.split(".");
  const paise = Number(BigInt(whole!) * 100n + BigInt(`${fractional}00`.slice(0, 2)));

  await razorpayProvider.refund(
    payment.providerPaymentId,
    paise,
  );

  const cancelOrder =
    payment.order.status !== OrderStatus.SHIPPED;

  const result =
    await repository.markRefunded(
      payment.id,
      payment.order.id,
      cancelOrder,
    );

  return {
    alreadyRefunded: false,
    reason: input.reason,
    ...result,
  };
}