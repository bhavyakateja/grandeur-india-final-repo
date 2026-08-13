import { PaymentProvider } from "../../generated/prisma/client";
import { razorpayProvider } from "./providers/razorpay";
import { stripeProvider } from "./providers/stripe";
import type { PaymentGateway } from "./types";

const provider = process.env.PAYMENT_PROVIDER ?? "RAZORPAY";

export const paymentProvider =
  provider === "STRIPE" ? PaymentProvider.STRIPE : PaymentProvider.RAZORPAY;

export const paymentGateway: PaymentGateway =
  paymentProvider === PaymentProvider.STRIPE ? stripeProvider : razorpayProvider;
