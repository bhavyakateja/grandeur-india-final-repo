import Stripe from "stripe";

import { InternalServerException } from "../../../exceptions/InternalServerException";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  PaymentGateway,
  VerifyPaymentRequest,
} from "../types";

function client() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new InternalServerException("Stripe is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export const stripeProvider: PaymentGateway = {
  async createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      const paymentIntent = await client().paymentIntents.create({
        amount: Math.round(data.amount * 100),
        currency: data.currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
      });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
      };
    } catch {
      throw new InternalServerException("Unable to create Stripe Payment Intent");
    }
  },

  async verify(data: VerifyPaymentRequest): Promise<boolean> {
    try {
      const paymentIntent = await client().paymentIntents.retrieve(data.orderId);
      return paymentIntent.status === "succeeded";
    } catch {
      return false;
    }
  },

  async fetchPayment(paymentId: string) {
    return client().paymentIntents.retrieve(paymentId);
  },

  async refund(paymentId: string, amount?: number) {
    await client().refunds.create({
      payment_intent: paymentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });
  },
};
