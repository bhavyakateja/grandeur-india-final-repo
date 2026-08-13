import crypto from "node:crypto";
import Razorpay from "razorpay";

import { InternalServerException } from "../../../exceptions/InternalServerException";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  PaymentGateway,
  VerifyPaymentRequest,
} from "../types";

function client() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new InternalServerException("Razorpay is not configured");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export const razorpayProvider: PaymentGateway = {
  async createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
    const order = await client().orders.create({
      amount: Math.round(data.amount * 100),
      currency: data.currency,
    });

    return { id: order.id, amount: Number(order.amount), currency: order.currency };
  },

  async verify(data: VerifyPaymentRequest): Promise<boolean> {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new InternalServerException("Razorpay is not configured");
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${data.orderId}|${data.paymentId}`)
      .digest("hex");

    return data.signature.length === generatedSignature.length && crypto.timingSafeEqual(
      Buffer.from(generatedSignature),
      Buffer.from(data.signature)
    );
  },

  async fetchPayment(paymentId: string) {
    return client().payments.fetch(paymentId);
  },

  async refund(paymentId: string, amount?: number) {
    await client().payments.refund(paymentId, {
      amount: amount ? Math.round(amount * 100) : undefined,
    });
  },
};
