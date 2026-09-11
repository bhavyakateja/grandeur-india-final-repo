import {
  OrderStatus,
  PaymentStatus,
  ReviewStatus,
  type Role,
} from "../../generated/prisma/client";

import cloudinary from "../../config/cloudinary";
import { cache, CacheKeys } from "../redis";
import { razorpayProvider } from "../payment/providers/razorpay";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import type {
  AttachProductImagesInput,
} from "./schema";

import { BadRequestException } from "../../exceptions/BadRequestException";
import { NotFoundException } from "../../exceptions/NotFoundException";
import { randomUUID } from "node:crypto";

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

  /**
   * Auto-create Delhivery shipment when an order moves to SHIPPED.
   *
   * Domestic orders: trigger Delhivery B2C manifesting automatically.
   * International orders: skip (admin sets waybill manually).
   *
   * This is intentionally non-fatal: if Delhivery is unavailable or the
   * order already has a waybill, the status transition still succeeds.
   */
  if (next === OrderStatus.SHIPPED && !order.isInternational) {
    try {
      const { createShipmentForOrder } = await import("../shipping/service");
      await createShipmentForOrder(id);
    } catch (err) {
      // Log but do not block the status update
      logger.warn(
        { err, orderId: id },
        "Auto-create Delhivery shipment failed; admin can retry via the shipping panel",
      );
    }
  }

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
  const to = query.to
    ? new Date(query.to)
    : new Date();
  to.setUTCHours(23, 59, 59, 999);

  const from = query.from
    ? new Date(query.from)
    : new Date(
      to.getTime() -
      29 * 24 * 60 * 60 * 1000,
    );
  from.setUTCHours(0, 0, 0, 0);

  const [
    kpis,
    salesByDay,
    topProducts,
    statusCounts,
  ] = await Promise.all([
    repository.dashboardKpis(from, to),
    repository.salesByDay(from, to),
    repository.topSellingProducts(
      from,
      to,
      20,
    ),
    repository.orderStatusCounts(from, to),
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

  const metadata =
    payment.metadata && typeof payment.metadata === "object"
      ? payment.metadata as Record<string, unknown>
      : {};
  const paymentAmount = Number(payment.amount);
  const refundedAmount = typeof metadata.refundedAmount === "number"
    ? metadata.refundedAmount
    : 0;
  const remainingAmount = Math.max(0, paymentAmount - refundedAmount);
  const amount = input.amount ?? remainingAmount;

  if (!Number.isFinite(amount) || amount <= 0 || amount > remainingAmount) {
    throw new BadRequestException(
      `Refund amount must be greater than 0 and no more than ${remainingAmount.toFixed(2)}`,
    );
  }

  const amountPaise = Math.round(amount * 100);
  await razorpayProvider.refund(
    payment.providerPaymentId,
    amountPaise,
  );

  const isFullRefund = Math.abs(amount - remainingAmount) < 0.005;
  const cancelOrder =
    isFullRefund && payment.order.status !== OrderStatus.SHIPPED;

  const result =
    await repository.markRefunded(
      payment.id,
      payment.order.id,
      cancelOrder,
      refundedAmount + amount,
      isFullRefund,
    );

  return {
    alreadyRefunded: false,
    reason: input.reason,
    ...result,
  };
}

export async function uploadProductImage(
  productId: string,
  file: File,
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

  if (!file.type.startsWith("image/")) {
    throw new BadRequestException(
      "Only image files are allowed",
    );
  }

  const MAX_SIZE = 10 * 1024 * 1024;

  if (file.size > MAX_SIZE) {
    throw new BadRequestException(
      "Image must be smaller than 10MB",
    );
  }

  const allowedTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
  ]);

  if (!allowedTypes.has(file.type)) {
    throw new BadRequestException(
      "Supported image formats are JPEG, PNG, WebP and AVIF",
    );
  }

  const buffer = Buffer.from(
    await file.arrayBuffer(),
  );

  const upload = await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const stream =
      cloudinary.uploader.upload_stream(
        {
          folder: "ecommerce/products",
          resource_type: "image",
          public_id: `${productId}-${randomUUID()}`,
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(
              error ??
              new Error(
                "Cloudinary upload failed",
              ),
            );
            return;
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );

    stream.end(buffer);
  });

  const isPrimary =
    product.images.length === 0;

  try {
    const image =
      await repository.attachProductImage(
        productId,
        {
          url: upload.secure_url,
          publicId: upload.public_id,
          isPrimary,
        },
      );

    await cache.remove(
      CacheKeys.product(productId),
    );

    return image;
  } catch (error) {
    // Prevent orphaned Cloudinary assets if
    // the database operation fails.
    try {
      await cloudinary.uploader.destroy(
        upload.public_id,
      );
    } catch {
      // Do not hide the original database error.
    }

    throw error;
  }
}

export async function getProductImageUploadSignature(
  productId: string,
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

  const timestamp =
    Math.floor(Date.now() / 1000);

  const folder =
    `ecommerce/products/${productId}`;

  const paramsToSign = {
    timestamp,
    folder,
  };

  const signature =
    cloudinary.utils.api_sign_request(
      paramsToSign,
      env.CLOUDINARY_API_SECRET,
    );

  return {
    signature,
    timestamp,
    folder,
    cloudName:
      env.CLOUDINARY_CLOUD_NAME,
    apiKey:
      env.CLOUDINARY_API_KEY,
  };
}

export async function attachProductImages(
  productId: string,
  input: AttachProductImagesInput,
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

  const existingPublicIds =
    new Set(
      product.images.map(
        (image) => image.publicId,
      ),
    );

  const duplicate =
    input.images.find(
      (image) =>
        existingPublicIds.has(
          image.publicId,
        ),
    );

  if (duplicate) {
    throw new BadRequestException(
      "One or more images are already attached to this product",
    );
  }

  const images =
    await repository.attachProductImages(
      productId,
      input.images.map((image) => ({
        url: image.url,
        publicId: image.publicId,
        isPrimary: false,
      })),
    );

  await cache.remove(
    CacheKeys.product(productId),
  );

  return images;
}