import crypto from "node:crypto";

import Razorpay from "razorpay";

import { env } from "../../../config/env";
import { InternalServerException } from "../../../exceptions/InternalServerException";

import type {
  CreateOrderRequest,
  CreateOrderResponse,
  PaymentGateway,
  VerifyPaymentRequest,
} from "../types";

function getClient(): Razorpay {
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

export const razorpayProvider: PaymentGateway = {
  async createOrder(
    data: CreateOrderRequest,
  ): Promise<CreateOrderResponse> {
    try {
      const order = await getClient().orders.create({
        amount: data.amount,
        currency: data.currency,
      });

      return {
        id: order.id,
        amount: Number(order.amount),
        currency: order.currency,
      };
    } catch {
      throw new InternalServerException(
        "Unable to create Razorpay order",
      );
    }
  },

  async verify(
    data: VerifyPaymentRequest,
  ): Promise<boolean> {
    const generatedSignature = crypto
      .createHmac(
        "sha256",
        env.RAZORPAY_KEY_SECRET,
      )
      .update(
        `${data.orderId}|${data.paymentId}`,
      )
      .digest("hex");

    const expected =
      Buffer.from(generatedSignature);

    const received =
      Buffer.from(data.signature);

    if (
      expected.length !==
      received.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      expected,
      received,
    );
  },

  async fetchPayment(paymentId: string) {
    try {
      return await getClient().payments.fetch(
        paymentId,
      );
    } catch {
      throw new InternalServerException(
        "Unable to fetch Razorpay payment",
      );
    }
  },

  async refund(
    paymentId: string,
    amount?: number,
  ): Promise<void> {
    try {
      await getClient().payments.refund(
        paymentId,
        {
          amount:
            amount !== undefined
              ? Math.round(amount * 100)
              : undefined,
        },
      );
    } catch {
      throw new InternalServerException(
        "Unable to process Razorpay refund",
      );
    }
  },
};
