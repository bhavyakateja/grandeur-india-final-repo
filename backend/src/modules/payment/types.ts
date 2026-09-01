export interface CreateOrderRequest {
  /** Razorpay accepts integer currency subunits (paise). */
  amount: number;
  currency: string;
}

export interface CreateOrderResponse {
  id: string;
  amount: number;
  currency: string;
}

export interface VerifyPaymentRequest {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface PaymentGateway {
  createOrder(
    data: CreateOrderRequest,
  ): Promise<CreateOrderResponse>;

  verify(
    data: VerifyPaymentRequest,
  ): Promise<boolean>;

  fetchPayment(
    paymentId: string,
  ): Promise<unknown>;

  /** @param amountPaise — refund amount in smallest currency unit (paise). Omit for full refund. */
  refund(
    paymentId: string,
    amountPaise?: number,
  ): Promise<void>;
}
