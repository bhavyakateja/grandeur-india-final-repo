import { razorpayProvider } from "./providers/razorpay";

import type {
  PaymentGateway,
} from "./types";

export const paymentGateway: PaymentGateway =
  razorpayProvider;