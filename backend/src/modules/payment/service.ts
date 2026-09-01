import crypto from "node:crypto";

import {
  PaymentProvider,
} from "../../generated/prisma/client";

import {
  BadRequestException,
} from "../../exceptions/BadRequestException";

import {
  NotFoundException,
} from "../../exceptions/NotFoundException";

import { env } from "../../config/env";

import type {
  CheckoutSnapshot,
} from "../../types/checkout";

import * as checkoutService
  from "../checkout/service";

import * as checkoutRepository
  from "../checkout/repository";

import * as orderService
  from "../orders/service";

import * as couponService
  from "../coupon/service";

import * as couponRepository
  from "../coupon/repository";

import * as notificationService
  from "../notification/service";

import {
  paymentGateway,
} from "./gateway";

import * as repository
  from "./repository";

import type {
  CreatePaymentInput,
  VerifyPaymentInput,
} from "./schema";

const adminEmail = env.RESEND_ADMIN_EMAIL;

/**
 * Convert the current checkout result into an
 * immutable snapshot.
 *
 * This snapshot is stored inside the Payment record
 * and later becomes the source of truth for Order
 * creation.
 */
function createSnapshot(
  checkout: Awaited<
    ReturnType<typeof checkoutService.checkout>
  >,
  addressId: string,
  address: Awaited<
    ReturnType<typeof checkoutRepository.findAddress>
  >,
  couponCode?: string,
): CheckoutSnapshot {
  if (!address) {
    throw new NotFoundException(
      "Address not found",
    );
  }

  return {
    addressId,

    address: {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
    },

    items: checkout.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
      total: item.total.toFixed(2),
    })),

    subtotal: checkout.subtotal.toFixed(2),
    discount: checkout.discount.toFixed(2),
    shipping: checkout.shipping.toFixed(2),
    tax: checkout.tax.toFixed(2),
    total: checkout.total.toFixed(2),

    couponCode,
  };
}

/**
 * Create a local pending payment and a Razorpay order.
 *
 * No Order is created here.
 */
export async function createPayment(
  userId: string,
  data: CreatePaymentInput,
) {
  const checkout =
    await checkoutService.checkout(
      userId,
      data,
    );

  const address =
    await checkoutRepository.findAddress(
      userId,
      data.addressId,
    );

  const checkoutSnapshot =
    createSnapshot(
      checkout,
      data.addressId,
      address,
      data.couponCode,
    );

  const amountInPaise = decimalToPaise(checkoutSnapshot.total);
  if (amountInPaise <= 0) {
    throw new BadRequestException(
      "Invalid checkout total",
    );
  }

  const providerOrder =
    await paymentGateway.createOrder({
      amount: amountInPaise,
      currency: "INR",
    });

  const payment =
    await repository.create({
      userId,
      provider:
        PaymentProvider.RAZORPAY,
      providerOrderId:
        providerOrder.id,
      amount:
        checkoutSnapshot.total,
      currency: "INR",
      metadata:
        checkoutSnapshot as unknown as import(
        "../../generated/prisma/client"
        ).Prisma.InputJsonValue,
    });

  return {
    paymentId: payment.id,
    provider: payment.provider,
    providerOrderId:
      providerOrder.id,
    amount:
      checkoutSnapshot.total,
    currency: "INR",
    key: env.RAZORPAY_KEY_ID,
  };
}

/**
 * Verify payment from the customer-facing flow.
 *
 * This is idempotent.
 */
export async function verifyPayment(
  userId: string,
  data: VerifyPaymentInput,
) {
  const payment =
    await repository.findByProviderOrderId(
      data.providerOrderId,
    );

  if (
    !payment ||
    payment.userId !== userId
  ) {
    throw new NotFoundException(
      "Payment not found",
    );
  }

  const verified =
    await paymentGateway.verify({
      orderId:
        data.providerOrderId,
      paymentId:
        data.providerPaymentId,
      signature:
        data.signature,
    });

  if (!verified) {
    throw new BadRequestException(
      "Payment verification failed",
    );
  }

  const gatewayPayment = await paymentGateway.fetchPayment(
    data.providerPaymentId,
  ) as {
    order_id?: string;
    status?: string;
    amount?: number;
    currency?: string;
  };

  if (
    gatewayPayment.order_id !== data.providerOrderId ||
    gatewayPayment.status !== "captured" ||
    gatewayPayment.currency !== payment.currency ||
    gatewayPayment.amount !== decimalToPaise(payment.amount.toFixed(2))
  ) {
    throw new BadRequestException("Razorpay payment does not match this order");
  }

  return settlePayment(
    data.providerOrderId,
    data.providerPaymentId,
  );
}

/**
 * Get a customer's payment.
 */
export async function getPayment(
  id: string,
  userId: string,
) {
  const payment =
    await repository.findForUser(
      id,
      userId,
    );

  if (!payment) {
    throw new NotFoundException(
      "Payment not found",
    );
  }

  return payment;
}

/**
 * Compare Razorpay webhook signatures
 * using a timing-safe comparison.
 */
function signatureMatches(
  body: string,
  signature: string,
  secret: string,
) {
  const expected =
    crypto
      .createHmac(
        "sha256",
        secret,
      )
      .update(body)
      .digest("hex");

  const expectedBuffer =
    Buffer.from(expected);

  const receivedBuffer =
    Buffer.from(signature);

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer,
  );
}

/**
 * Complete the successful payment flow.
 *
 * Payment PAID
 *      ↓
 * Create Order
 *      ↓
 * Consume Coupon
 *      ↓
 * Send Emails
 *
 * Every stage is designed to be idempotent.
 */
async function settlePayment(
  providerOrderId: string,
  providerPaymentId: string,
) {
  const payment =
    await repository.findByProviderOrderId(
      providerOrderId,
    );

  if (!payment) {
    throw new NotFoundException(
      "Payment not found",
    );
  }

  if (payment.status === "FAILED") {
    return;
  }

  if (
    payment.status === "PAID" &&
    payment.providerPaymentId !== providerPaymentId
  ) {
    throw new BadRequestException(
      "Payment was already settled with a different provider payment ID",
    );
  }

  const wasAlreadyPaid =
    payment.status === "PAID";

  const paidPayment =
    wasAlreadyPaid
      ? payment
      : await repository.markPaid(
        payment.id,
        providerPaymentId,
      );

  const orderResult =
    await orderService.createFromPayment(
      paidPayment,
    );

  /*
   * Order creation is itself idempotent.
   *
   * Only consume the coupon and send the
   * notifications on the first successful
   * payment transition.
   */
  if (orderResult.created) {
    await consumePaymentCoupon(
      paidPayment,
    );

    await sendOrderNotifications(
      paidPayment,
      orderResult.order,
    );
  }

  return orderResult.order;
}

/**
 * Consume coupon only after successful payment.
 */
async function consumePaymentCoupon(
  payment: Awaited<
    ReturnType<
      typeof repository.findByProviderOrderId
    >
  > extends infer T
    ? Exclude<T, null>
    : never,
) {
  const metadata =
    payment.metadata as {
      couponCode?: string;
    } | null;

  if (!metadata?.couponCode) {
    return;
  }

  const coupon =
    await couponRepository.findByCode(
      metadata.couponCode,
    );

  if (!coupon) {
    return;
  }

  /*
   * consumeCoupon is expected to be
   * protected by the coupon usage unique
   * constraint.
   */
  try {
    await couponService.consumeCoupon(
      coupon.id,
      payment.userId,
    );
  } catch {
    /*
     * Coupon consumption must not turn a
     * successful payment into a failed payment.
     */
  }
}

/**
 * Send customer + admin order notifications.
 *
 * Email failures never roll back the order.
 */
async function sendOrderNotifications(
  payment: Awaited<
    ReturnType<
      typeof repository.findByProviderOrderId
    >
  > extends infer T
    ? Exclude<T, null>
    : never,
  order: Awaited<ReturnType<typeof orderService.createFromPayment>>["order"],
) {
  try {
    await notificationService.email({
      to: payment.user.email,
      subject: "Order Confirmed",
      html: `
    <h2>Order Confirmed</h2>
    <p>Your order <strong>${order.orderNumber}</strong> has been placed successfully.</p>
  `,
      text: `Your order ${order.orderNumber} has been placed successfully.`,
    });
  } catch {
    // Email failure must never roll back
    // a successful payment/order.
  }

  try {
    await notificationService.email({
      to: adminEmail,
      subject: "New Order Received",
      html: `
    <h2>New Order Received</h2>
    <p>A new order <strong>${order.orderNumber}</strong> has been placed.</p>
  `,
      text: `A new order ${order.orderNumber} has been placed.`,
    });
  } catch {
    // Admin notification failure must never
    // affect the completed order.
  }
}

/** Convert a Decimal amount to Razorpay's integer paise without float arithmetic. */
function decimalToPaise(amount: string | undefined): number {
  if (!amount || !/^\d+(?:\.\d{1,2})?$/.test(amount)) {
    throw new BadRequestException("Invalid checkout total");
  }
  const [whole, fractional = ""] = amount.split(".");
  const normalizedFraction = `${fractional}00`.slice(0, 2);
  const paise = BigInt(whole!) * 100n + BigInt(normalizedFraction);

  if (paise > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new BadRequestException("Checkout total exceeds the payment limit");
  }

  return Number(paise);
}

/**
 * Razorpay webhook handler.
 */
export async function handleRazorpayWebhook(
  body: string,
  signature: string,
) {
  const secret =
    env.RAZORPAY_WEBHOOK_SECRET;

  if (
    !secret ||
    !signature ||
    !signatureMatches(
      body,
      signature,
      secret,
    )
  ) {
    throw new BadRequestException(
      "Invalid Razorpay webhook signature",
    );
  }

  let event: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          order_id?: string;
          id?: string;
        };
      };
    };
  };

  try {
    event =
      JSON.parse(body) as typeof event;
  } catch {
    throw new BadRequestException(
      "Invalid Razorpay webhook payload",
    );
  }

  /*
   * Only captured payments create orders.
   */
  if (
    event.event !==
    "payment.captured"
  ) {
    return;
  }

  const payment =
    event.payload?.payment?.entity;

  if (
    !payment?.order_id ||
    !payment.id
  ) {
    throw new BadRequestException(
      "Invalid Razorpay webhook payload",
    );
  }

  await settlePayment(
    payment.order_id,
    payment.id,
  );
}
