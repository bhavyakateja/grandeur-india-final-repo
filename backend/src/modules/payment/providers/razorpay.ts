import crypto from "node:crypto";

import Razorpay from "razorpay";

import { env } from "../../../config/env";
import { logger } from "../../../config/logger";
import { BadRequestException } from "../../../exceptions/BadRequestException";
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
        receipt: data.receipt,
        notes: data.notes,
      });

      return {
        id: order.id,
        amount: Number(order.amount),
        currency: order.currency,
      };
    } catch (error) {
      logger.error({ err: error }, "Failed to create Razorpay order");
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

  async capture(
    paymentId: string,
    amountPaise: number,
    currency: string = "INR",
  ): Promise<unknown> {
    try {
      return await getClient().payments.capture(
        paymentId,
        amountPaise,
        currency,
      );
    } catch (error) {
      logger.error(
        { err: error, paymentId, amountPaise },
        "Razorpay payment capture failed",
      );
      throw new BadRequestException("Unable to capture payment");
    }
  },

  async refund(
    paymentId: string,
    amountPaise?: number,
  ): Promise<void> {
    try {
      await getClient().payments.refund(
        paymentId,
        {
          amount: amountPaise,
        },
      );
    } catch (error) {
      logger.error(
        { err: error, paymentId },
        "Razorpay refund failed",
      );
      const description =
        error && typeof error === "object" && "error" in error &&
          error.error && typeof error.error === "object" &&
          "description" in error.error &&
          typeof error.error.description === "string"
          ? error.error.description
          : "Unable to process Razorpay refund";
      throw new BadRequestException(description);
    }
  },
};
