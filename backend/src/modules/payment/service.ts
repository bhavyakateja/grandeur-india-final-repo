import { PaymentProvider } from "../../generated/prisma/client";
import crypto from "node:crypto";
import Stripe from "stripe";
import { BadRequestException } from "../../exceptions/BadRequestException";
import { NotFoundException } from "../../exceptions/NotFoundException";
import type { CheckoutSnapshot } from "../../types/checkout";
import * as checkoutService from "../checkout/service";
import * as checkoutRepository from "../checkout/repository";
import * as orderService from "../orders/service";
import { paymentGateway, paymentProvider } from "./gateway";
import * as repository from "./repository";
import * as couponService from "../coupon/service";
import * as couponRepository from "../coupon/repository";
import * as queue from "../queue";
import { logger } from "../logger";
import { paymentFailure, paymentSuccess } from "../metrics";

function snapshot(checkout: Awaited<ReturnType<typeof checkoutService.checkout>>, addressId: string, address: Awaited<ReturnType<typeof checkoutRepository.findAddress>>, couponCode?: string): CheckoutSnapshot {
  if (!address) throw new NotFoundException("Address not found");
  return {
    addressId,
    address: { fullName: address.fullName, phone: address.phone, addressLine1: address.addressLine1, addressLine2: address.addressLine2, city: address.city, state: address.state, country: address.country, postalCode: address.postalCode },
    items: checkout.items.map((item) => ({ productId: item.productId, name: item.name, quantity: item.quantity, unitPrice: item.unitPrice.toFixed(2), total: item.total.toFixed(2) })),
    subtotal: checkout.subtotal.toFixed(2), discount: checkout.discount.toFixed(2), shipping: checkout.shipping.toFixed(2), tax: checkout.tax.toFixed(2), total: checkout.total.toFixed(2), couponCode,
  };
}

export async function createPayment(userId: string, data: { addressId: string; couponCode?: string }) {
  const checkout = await checkoutService.checkout(userId, data);
  const address = await checkoutRepository.findAddress(userId, data.addressId);
  const checkoutSnapshot = snapshot(checkout, data.addressId, address, data.couponCode);
  const amount = Number(checkoutSnapshot.total);
  if (!Number.isSafeInteger(Math.round(amount * 100)) || amount <= 0) throw new BadRequestException("Invalid checkout total");

  const providerOrder = await paymentGateway.createOrder({ amount, currency: "INR" });
  const payment = await repository.create({
    userId,
    provider: paymentProvider,
    providerOrderId: providerOrder.id,
    amount: checkoutSnapshot.total,
    currency: "INR",
    metadata: checkoutSnapshot as unknown as import("../../generated/prisma/client").Prisma.InputJsonValue,
  });
  logger.info({
    paymentId: payment.id,
    provider: payment.provider,
    amount: payment.amount.toString(),
  }, "Payment Created");

  return {
    paymentId: payment.id, provider: payment.provider, providerOrderId: providerOrder.id,
    amount: checkoutSnapshot.total, currency: "INR",
    key: paymentProvider === PaymentProvider.RAZORPAY ? process.env.RAZORPAY_KEY_ID : undefined,
  };
}

export async function verifyPayment(userId: string, data: { providerOrderId: string; providerPaymentId: string; signature: string }) {
  const payment = await repository.findByProviderOrderId(data.providerOrderId);
  if (!payment || payment.userId !== userId) throw new NotFoundException("Payment not found");

  const verified = await paymentGateway.verify({ orderId: data.providerOrderId, paymentId: data.providerPaymentId, signature: data.signature });
  if (!verified) {
    logger.error({
      paymentId: payment.id,
      userId,
      provider: payment.provider,
    }, "Payment Failed");
    paymentFailure.inc({ provider: payment.provider });
    throw new BadRequestException("Payment verification failed");
  }
  if (payment.status === "FAILED") throw new BadRequestException("Payment has already failed");
  const wasAlreadyPaid = payment.status === "PAID";
  const paidPayment = wasAlreadyPaid ? payment : await repository.markPaid(
    payment.id,
    data.providerPaymentId
  );
  if (!wasAlreadyPaid) paymentSuccess.inc({ provider: payment.provider });

  const order = await orderService.createFromPayment(paidPayment);

  if (!wasAlreadyPaid) await consumePaymentCoupon(paidPayment);

  await enqueueOrderJobs(paidPayment, order);

  logger.info({
    paymentId: paidPayment.id,
    orderId: order.id,
    userId,
  }, "Payment Successful");

  return order;
}

export async function getPayment(id: string, userId: string) {
  const payment = await repository.findForUser(id, userId);
  if (!payment) throw new NotFoundException("Payment not found");
  return payment;
}

function signatureMatches(body: string, signature: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

async function settlePayment(providerOrderId: string, providerPaymentId: string) {
  const payment = await repository.findByProviderOrderId(providerOrderId);
  if (!payment || payment.status === "FAILED") return;
  const wasAlreadyPaid = payment.status === "PAID";
  const paidPayment = wasAlreadyPaid ? payment : await repository.markPaid(payment.id, providerPaymentId);
  if (!wasAlreadyPaid) paymentSuccess.inc({ provider: payment.provider });
  const order = await orderService.createFromPayment(paidPayment);
  if (!wasAlreadyPaid) await consumePaymentCoupon(paidPayment);
  await enqueueOrderJobs(paidPayment, order);
  logger.info({
    paymentId: paidPayment.id,
    orderId: order.id,
    userId: paidPayment.userId,
  }, "Payment Successful");
}

async function consumePaymentCoupon(
  payment: Awaited<ReturnType<typeof repository.findByProviderOrderId>> extends infer T ? Exclude<T, null> : never
) {
  const metadata = payment.metadata as { couponCode?: string } | null;
  if (!metadata?.couponCode) return;
  const coupon = await couponRepository.findByCode(metadata.couponCode);
  if (coupon) await couponService.consumeCoupon(coupon.id, payment.userId);
}

async function enqueueOrderJobs(
  payment: Awaited<ReturnType<typeof repository.findByProviderOrderId>> extends infer T ? Exclude<T, null> : never,
  order: Awaited<ReturnType<typeof orderService.createFromPayment>>
) {
  await queue.enqueueEmail({
    to: payment.user.email,
    subject: "Order Confirmed",
    message: `Your order ${order.orderNumber} has been placed.`,
  }, `order:${order.id}:confirmation-email`);
}

export async function handleRazorpayWebhook(body: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature || !signatureMatches(body, signature, secret)) {
    throw new BadRequestException("Invalid Razorpay webhook signature");
  }
  const event = JSON.parse(body) as { event?: string; payload?: { payment?: { entity?: { order_id?: string; id?: string } } } };
  if (event.event !== "payment.captured") return;
  const payment = event.payload?.payment?.entity;
  if (!payment?.order_id || !payment.id) throw new BadRequestException("Invalid Razorpay webhook payload");
  await settlePayment(payment.order_id, payment.id);
}

export async function handleStripeWebhook(body: string, signature: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signature || !process.env.STRIPE_SECRET_KEY) {
    throw new BadRequestException("Stripe webhooks are not configured");
  }
  let event: Stripe.Event;
  try {
    event = new Stripe(process.env.STRIPE_SECRET_KEY).webhooks.constructEvent(body, signature, secret);
  } catch {
    throw new BadRequestException("Invalid Stripe webhook signature");
  }
  if (event.type !== "payment_intent.succeeded") return;
  const intent = event.data.object as Stripe.PaymentIntent;
  await settlePayment(intent.id, intent.id);
}
